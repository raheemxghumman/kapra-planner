import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import type { PaginationQueryDto, Paginated } from '../../common/dto/pagination.dto.js';
import { GEOCODER, type Geocoder } from '../../integrations/geocoding/geocoder.types.js';
import { locateAddress } from '../../integrations/geocoding/locate-address.js';
import {
  IMAGE_STORAGE,
  type ImageStorage,
} from '../../integrations/storage/image-storage.types.js';
import { slugify } from '../brands/brands.service.js';
import type {
  CreateTailorServiceDto,
  UpdateTailorServiceDto,
  UpsertTailorProfileDto,
} from './dto/tailor.dto.js';
import { Review } from './entities/review.entity.js';
import { TailorProfile } from './entities/tailor-profile.entity.js';
import { TailorService } from './entities/tailor-service.entity.js';
import { TailorsService, type PublicReview } from './tailors.service.js';

const MAX_GALLERY = 8;

/** The tailor's own side: shop profile, services, gallery and replies to reviews. */
@Injectable()
export class TailorPanelService {
  constructor(
    @InjectRepository(TailorProfile) private readonly tailors: Repository<TailorProfile>,
    @InjectRepository(TailorService) private readonly services: Repository<TailorService>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @Inject(GEOCODER) private readonly geocoder: Geocoder,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    private readonly tailorsService: TailorsService,
  ) {}

  /** The tailor's profile, or null before they have set up their shop. */
  findOwn(userId: string): Promise<TailorProfile | null> {
    return this.tailors.findOne({
      where: { userId },
      relations: { services: true },
      order: { services: { price: 'ASC' } },
    });
  }

  async requireOwn(userId: string): Promise<TailorProfile> {
    const tailor = await this.tailors.findOneBy({ userId });
    if (!tailor) throw new BadRequestException('Set up your shop profile first');
    return tailor;
  }

  /** Creates or updates the shop. Uses the map pin if given, otherwise looks the address up. */
  async upsert(userId: string, dto: UpsertTailorProfileDto): Promise<TailorProfile> {
    const existing = await this.tailors.findOneBy({ userId });
    const { lat, lng } = await this.locate(dto, existing);

    const tailor =
      existing ?? this.tailors.create({ userId, slug: await this.uniqueSlug(dto.businessName) });
    Object.assign(tailor, {
      businessName: dto.businessName,
      bio: dto.bio ?? null,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      lat,
      lng,
      specialities: dto.specialities,
      turnaroundDays: dto.turnaroundDays,
      homeVisits: dto.homeVisits,
    });
    await this.tailors.save(tailor);
    return (await this.findOwn(userId))!;
  }

  private async locate(dto: UpsertTailorProfileDto, existing: TailorProfile | null) {
    if (dto.lat !== undefined && dto.lng !== undefined) return { lat: dto.lat, lng: dto.lng };
    if (existing && existing.address === dto.address && existing.city === dto.city) {
      return { lat: existing.lat, lng: existing.lng };
    }
    const place = await locateAddress(this.geocoder, dto.address, dto.city);
    if (!place) {
      throw new UnprocessableEntityException(
        'We could not find this address on the map. Drop a pin on the map instead.',
      );
    }
    return { lat: place.lat, lng: place.lng };
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'tailor';
    let slug = base;
    for (let n = 2; await this.tailors.existsBy({ slug }); n++) slug = `${base}-${n}`;
    return slug;
  }

  // ---- Services ----

  async addService(userId: string, dto: CreateTailorServiceDto): Promise<TailorService> {
    const tailor = await this.requireOwn(userId);
    const service = await this.services.save(
      Object.assign(this.services.create(dto), { tailorId: tailor.id }),
    );
    await this.refreshPriceFrom(tailor.id);
    return service;
  }

  async updateService(
    userId: string,
    id: string,
    dto: UpdateTailorServiceDto,
  ): Promise<TailorService> {
    const service = await this.findOwnService(userId, id);
    Object.assign(service, dto);
    await this.services.save(service);
    await this.refreshPriceFrom(service.tailorId);
    return service;
  }

  async removeService(userId: string, id: string): Promise<void> {
    const service = await this.findOwnService(userId, id);
    await this.services.delete(service.id);
    await this.refreshPriceFrom(service.tailorId);
  }

  private async findOwnService(userId: string, id: string): Promise<TailorService> {
    const service = await this.services.findOne({ where: { id, tailor: { userId } } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  /** Keeps "from Rs X" on the map card equal to the cheapest active service. */
  private async refreshPriceFrom(tailorId: string): Promise<void> {
    const cheapest = await this.services.findOne({
      where: { tailorId, isActive: true },
      order: { price: 'ASC' },
      select: { id: true, price: true },
    });
    await this.tailors.update(tailorId, { priceFrom: cheapest?.price ?? null });
  }

  // ---- Gallery ----

  async addGalleryImage(userId: string, file: Express.Multer.File): Promise<TailorProfile> {
    const tailor = await this.requireOwn(userId);
    if (tailor.gallery.length >= MAX_GALLERY) {
      throw new BadRequestException(`You can show up to ${MAX_GALLERY} photos; remove one first`);
    }
    const stored = await this.storage.upload(file.buffer, { folder: 'tailors', maxSize: 1600 });
    tailor.gallery = [...tailor.gallery, stored];
    await this.tailors.update(tailor.id, { gallery: tailor.gallery });
    return tailor;
  }

  async removeGalleryImage(userId: string, index: number): Promise<TailorProfile> {
    const tailor = await this.requireOwn(userId);
    const image = tailor.gallery[index];
    if (!image) throw new NotFoundException('Photo not found');
    await this.storage.remove(image.publicId);
    tailor.gallery = tailor.gallery.filter((_, i) => i !== index);
    await this.tailors.update(tailor.id, { gallery: tailor.gallery });
    return tailor;
  }

  // ---- Reviews ----

  async listReviews(userId: string, query: PaginationQueryDto): Promise<Paginated<PublicReview>> {
    const tailor = await this.requireOwn(userId);
    return this.tailorsService.listReviews(tailor.id, query);
  }

  async reply(userId: string, reviewId: string, reply: string): Promise<Review> {
    const review = await this.reviews.findOne({
      where: { id: reviewId, tailor: { userId }, isHidden: Not(true) },
    });
    if (!review) throw new NotFoundException('Review not found');
    review.reply = reply;
    review.repliedAt = new Date();
    return this.reviews.save(review);
  }
}
