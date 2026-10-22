import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import {
  IMAGE_STORAGE,
  type ImageStorage,
} from '../../integrations/storage/image-storage.types.js';
import { runProviderChain } from '../../integrations/tryon/provider-chain.js';
import {
  TRY_ON_PROVIDERS,
  type GarmentType,
  type TryOnProvider,
} from '../../integrations/tryon/tryon.types.js';
import { OutfitSlot, SLOT_FOR_CATEGORY } from '../catalogue/catalogue.enums.js';
import type { Product } from '../catalogue/entities/product.entity.js';
import { ProductsService } from '../catalogue/products.service.js';
import type { CreateTryOnDto } from './dto/try-on.dto.js';
import { PersonPhoto } from './entities/person-photo.entity.js';
import { TryOn, TryOnStatus } from './entities/try-on.entity.js';

const MAX_PHOTOS = 3;
/** Free GPU Spaces queue jobs; give each provider up to 3 minutes. */
const PROVIDER_TIMEOUT_MS = 180_000;

const GARMENT_FOR_SLOT: Partial<Record<OutfitSlot, GarmentType>> = {
  [OutfitSlot.Top]: 'upper',
  [OutfitSlot.Outer]: 'upper',
  [OutfitSlot.Bottom]: 'lower',
  [OutfitSlot.FullLook]: 'full',
};

const ACTIVE = [TryOnStatus.Pending, TryOnStatus.Processing];
/** A job can take at most 2 providers x 3 minutes; one untouched for 10 minutes is dead. */
const staleBefore = () => new Date(Date.now() - 10 * 60_000);

async function download(url: string): Promise<Blob> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Could not download ${url} (${response.status})`);
  return response.blob();
}

/** Shopify's CDN resizes on the fly; a 768px garment image is plenty for try-on. */
const garmentUrl = (url: string) =>
  url.includes('cdn.shopify.com') ? `${url}${url.includes('?') ? '&' : '?'}width=768` : url;

@Injectable()
export class TryOnService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TryOnService.name);

  constructor(
    @Inject(TRY_ON_PROVIDERS) private readonly providers: TryOnProvider[],
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @InjectRepository(PersonPhoto) private readonly photos: Repository<PersonPhoto>,
    @InjectRepository(TryOn) private readonly tryOns: Repository<TryOn>,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Jobs that were running when the server stopped will never finish; mark them failed. Only
   * stale ones: scripts that start the app (seeds, jobs) must not cancel a live server's jobs.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.tryOns.update(
      { status: In(ACTIVE), updatedAt: LessThan(staleBefore()) },
      { status: TryOnStatus.Failed, error: 'Interrupted by a server restart. Please try again.' },
    );
  }

  // ---- Photos ----

  listPhotos(userId: string): Promise<PersonPhoto[]> {
    return this.photos.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async uploadPhoto(userId: string, file: Express.Multer.File): Promise<PersonPhoto> {
    if ((await this.photos.countBy({ userId })) >= MAX_PHOTOS) {
      throw new BadRequestException(`You can keep up to ${MAX_PHOTOS} photos; delete one first`);
    }
    const stored = await this.storage.upload(file.buffer, { folder: 'people', maxSize: 1024 });
    return this.photos.save(
      this.photos.create({ userId, url: stored.url, publicId: stored.publicId }),
    );
  }

  /** Deletes the photo, every try-on made with it, and their files. */
  async removePhoto(userId: string, id: string): Promise<void> {
    const photo = await this.photos.findOneBy({ id, userId });
    if (!photo) throw new NotFoundException('Photo not found');
    const results = await this.tryOns.find({
      where: { photoId: id },
      select: { id: true, resultPublicId: true },
    });
    await Promise.all([
      this.storage.remove(photo.publicId),
      ...results
        .filter((tryOn) => tryOn.resultPublicId)
        .map((tryOn) => this.storage.remove(tryOn.resultPublicId!)),
    ]);
    await this.photos.delete(photo.id); // try-ons go with it (ON DELETE CASCADE)
  }

  // ---- Try-ons ----

  /**
   * Starts a try-on and returns at once (202). A finished result for the same photo and
   * product is reused, and each customer runs one job at a time (free GPUs are shared).
   */
  async create(userId: string, dto: CreateTryOnDto): Promise<TryOn> {
    const photo = await this.photos.findOneBy({ id: dto.photoId, userId });
    if (!photo) throw new NotFoundException('Photo not found');
    const product = await this.productsService.findById(dto.productId);
    this.garmentTypeOf(product); // throws for shoes, jewellery, etc.

    const cached = await this.tryOns.findOneBy({
      userId,
      photoId: photo.id,
      productId: product.id,
      status: TryOnStatus.Completed,
    });
    if (cached) return cached;

    if (
      await this.tryOns.existsBy({ userId, status: In(ACTIVE), updatedAt: MoreThan(staleBefore()) })
    ) {
      throw new ConflictException(
        'Your previous try-on is still running; please wait for it to finish',
      );
    }

    const tryOn = await this.tryOns.save(
      this.tryOns.create({ userId, photoId: photo.id, productId: product.id }),
    );
    // Not awaited: the request returns now and the client polls GET /tryons/:id.
    void this.process(tryOn.id, photo, product);
    return tryOn;
  }

  private garmentTypeOf(product: Product): GarmentType {
    const slot = SLOT_FOR_CATEGORY[product.category];
    const garmentType = slot ? GARMENT_FOR_SLOT[slot] : undefined;
    if (!garmentType)
      throw new BadRequestException(
        'Only clothing (tops, bottoms, suits and dresses) can be tried on',
      );
    if (!product.images.length)
      throw new BadRequestException('This product has no image to try on');
    return garmentType;
  }

  /** Background job: download both images, run the provider chain, store the result. */
  private async process(id: string, photo: PersonPhoto, product: Product): Promise<void> {
    const startedAt = Date.now();
    await this.tryOns.update(id, { status: TryOnStatus.Processing });

    try {
      const [person, garment] = await Promise.all([
        download(photo.url),
        download(garmentUrl(product.images[0])),
      ]);
      const description = [product.colours[0], product.fabric, product.category]
        .filter(Boolean)
        .join(' ');
      const { provider, image } = await runProviderChain(
        this.providers,
        { person, garment, garmentType: this.garmentTypeOf(product), description },
        PROVIDER_TIMEOUT_MS,
      );
      const stored = await this.storage.upload(Buffer.from(await image.arrayBuffer()), {
        folder: 'tryons',
      });
      await this.tryOns.update(id, {
        status: TryOnStatus.Completed,
        provider,
        resultUrl: stored.url,
        resultPublicId: stored.publicId,
        durationMs: Date.now() - startedAt,
      });
      this.logger.log(`Try-on ${id} done by ${provider} in ${Date.now() - startedAt} ms`);
    } catch (error) {
      this.logger.error(`Try-on ${id} failed: ${(error as Error).message}`);
      await this.tryOns.update(id, {
        status: TryOnStatus.Failed,
        durationMs: Date.now() - startedAt,
        error: 'The free try-on service is busy right now. Please try again in a few minutes.',
      });
    }
  }

  async findOne(userId: string, id: string): Promise<TryOn> {
    const tryOn = await this.tryOns.findOne({
      where: { id, userId },
      relations: { product: { brand: true }, photo: true },
    });
    if (!tryOn) throw new NotFoundException('Try-on not found');
    return tryOn;
  }

  list(userId: string): Promise<TryOn[]> {
    return this.tryOns.find({
      where: { userId },
      relations: { product: { brand: true }, photo: true },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const tryOn = await this.findOne(userId, id);
    if (ACTIVE.includes(tryOn.status))
      throw new ConflictException('Wait for the try-on to finish before deleting it');
    if (tryOn.resultPublicId) await this.storage.remove(tryOn.resultPublicId);
    await this.tryOns.delete(tryOn.id);
  }
}
