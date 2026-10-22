import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import { GEOCODER, type Geocoder } from '../../integrations/geocoding/geocoder.types.js';
import { locateAddress } from '../../integrations/geocoding/locate-address.js';
import {
  IMAGE_STORAGE,
  type ImageStorage,
} from '../../integrations/storage/image-storage.types.js';
import { BrandStore } from '../brands/entities/brand-store.entity.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { ProductVariant } from '../catalogue/entities/product-variant.entity.js';
import { Product } from '../catalogue/entities/product.entity.js';
import { ProductsService } from '../catalogue/products.service.js';
import type {
  BrandProductQueryDto,
  CreateBrandProductDto,
  StoreDto,
  UpdateBrandProductDto,
  UpdateBrandProfileDto,
  VariantStockDto,
} from './dto/brand-panel.dto.js';

const MAX_IMAGES = 8;
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** A brand account manages the brand an admin linked to it (brands.owner_id). */
@Injectable()
export class BrandPanelService {
  constructor(
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(BrandStore) private readonly stores: Repository<BrandStore>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(GEOCODER) private readonly geocoder: Geocoder,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    private readonly productsService: ProductsService,
  ) {}

  /** The brand this user owns, or null while an admin has not linked one yet. */
  findOwn(userId: string): Promise<Brand | null> {
    return this.brands.findOne({ where: { ownerId: userId }, relations: { stores: true } });
  }

  async requireOwn(userId: string): Promise<Brand> {
    const brand = await this.brands.findOneBy({ ownerId: userId });
    if (!brand)
      throw new ForbiddenException(
        'Your account is not linked to a brand yet. An admin links it after verification.',
      );
    return brand;
  }

  async updateProfile(userId: string, dto: UpdateBrandProfileDto): Promise<Brand> {
    const brand = await this.requireOwn(userId);
    await this.brands.update(brand.id, {
      description: dto.description ?? brand.description,
      website: dto.website ?? brand.website,
    });
    return (await this.findOwn(userId))!;
  }

  async uploadLogo(userId: string, file: Express.Multer.File): Promise<Brand> {
    const brand = await this.requireOwn(userId);
    const stored = await this.storage.upload(file.buffer, { folder: 'brands', maxSize: 600 });
    await this.brands.update(brand.id, { logoUrl: stored.url });
    return (await this.findOwn(userId))!;
  }

  // ---- Stores (shown on the map) ----

  async addStore(userId: string, dto: StoreDto): Promise<BrandStore> {
    const brand = await this.requireOwn(userId);
    const { lat, lng } = await this.locate(dto);
    return this.stores.save(
      this.stores.create({
        brandId: brand.id,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        lat,
        lng,
      }),
    );
  }

  async updateStore(userId: string, id: string, dto: StoreDto): Promise<BrandStore> {
    const brand = await this.requireOwn(userId);
    const store = await this.stores.findOneBy({ id, brandId: brand.id });
    if (!store) throw new NotFoundException('Store not found');
    const moved = store.address !== dto.address || store.city !== dto.city;
    const { lat, lng } = dto.lat !== undefined || moved ? await this.locate(dto) : store;
    Object.assign(store, { name: dto.name, address: dto.address, city: dto.city, lat, lng });
    return this.stores.save(store);
  }

  async removeStore(userId: string, id: string): Promise<void> {
    const brand = await this.requireOwn(userId);
    const result = await this.stores.delete({ id, brandId: brand.id });
    if (!result.affected) throw new NotFoundException('Store not found');
  }

  private async locate(dto: StoreDto): Promise<{ lat: number; lng: number }> {
    if (dto.lat !== undefined && dto.lng !== undefined) return { lat: dto.lat, lng: dto.lng };
    const place = await locateAddress(this.geocoder, dto.address, dto.city);
    if (!place)
      throw new UnprocessableEntityException(
        'We could not find this address on the map. Drop a pin instead.',
      );
    return place;
  }

  // ---- Products ----

  async listProducts(userId: string, query: BrandProductQueryDto): Promise<Paginated<Product>> {
    const brand = await this.requireOwn(userId);
    const qb = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .where('product.brandId = :brandId', { brandId: brand.id })
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('variant.size', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    if (query.q) qb.andWhere('product.title ILIKE :q', { q: `%${escapeLike(query.q)}%` });
    const [rows, total] = await qb.getManyAndCount();
    return paginate(rows, total, query);
  }

  private async ownProduct(userId: string, id: string): Promise<Product> {
    const brand = await this.requireOwn(userId);
    const product = await this.products.findOne({
      where: { id, brandId: brand.id },
      relations: { variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async setVisibility(userId: string, id: string, hidden: boolean): Promise<Product> {
    const product = await this.ownProduct(userId, id);
    await this.products.update(product.id, { hiddenByBrand: hidden });
    this.productsService.clearFacetsCache();
    return { ...product, hiddenByBrand: hidden };
  }

  async updateStock(
    userId: string,
    variantId: string,
    dto: VariantStockDto,
  ): Promise<ProductVariant> {
    const brand = await this.requireOwn(userId);
    const variant = await this.variants.findOne({
      where: { id: variantId, product: { brandId: brand.id } },
    });
    if (!variant) throw new NotFoundException('Size not found');
    variant.inStock = dto.inStock && dto.stockQty !== 0;
    if (dto.stockQty !== undefined) variant.stockQty = dto.stockQty;
    return this.variants.save(variant);
  }

  /** Listing by hand. Products from a shop feed are edited in the brand's own shop instead. */
  async createProduct(userId: string, dto: CreateBrandProductDto): Promise<Product> {
    const brand = await this.requireOwn(userId);
    const product = await this.products.save(
      this.products.create({
        brandId: brand.id,
        externalId: null,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category,
        gender: dto.gender,
        style: dto.style,
        colours: dto.colours,
        occasions: dto.occasions,
        fabric: dto.fabric ?? null,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice ?? null,
        images: [],
        isActive: true,
        // Not visible until it has a photo.
        hiddenByBrand: true,
        variants: dto.sizes.map((size) =>
          this.variants.create({
            size: size.size,
            stockQty: size.stockQty,
            inStock: size.stockQty > 0,
          }),
        ),
      }),
    );
    this.productsService.clearFacetsCache();
    return product;
  }

  async updateProduct(userId: string, id: string, dto: UpdateBrandProductDto): Promise<Product> {
    const product = await this.ownProduct(userId, id);
    if (product.externalId)
      throw new BadRequestException('This product comes from your shop feed; edit it in your shop');
    Object.assign(product, dto);
    await this.products.save(product);
    this.productsService.clearFacetsCache();
    return product;
  }

  async addImage(userId: string, id: string, file: Express.Multer.File): Promise<Product> {
    const product = await this.ownProduct(userId, id);
    if (product.externalId)
      throw new BadRequestException('Photos of feed products come from your shop');
    if (product.images.length >= MAX_IMAGES)
      throw new BadRequestException(`Up to ${MAX_IMAGES} photos per product`);
    const stored = await this.storage.upload(file.buffer, { folder: 'products', maxSize: 1600 });
    const first = product.images.length === 0;
    product.images = [...product.images, stored.url];
    // A new product goes live with its first photo.
    if (first) product.hiddenByBrand = false;
    await this.products.update(product.id, {
      images: product.images,
      hiddenByBrand: product.hiddenByBrand,
    });
    this.productsService.clearFacetsCache();
    return product;
  }

  async removeProduct(userId: string, id: string): Promise<void> {
    const product = await this.ownProduct(userId, id);
    if (product.externalId)
      throw new BadRequestException('Hide feed products instead of deleting them');
    await this.products.delete(product.id);
    this.productsService.clearFacetsCache();
  }

  // ---- Analytics ----

  /** Sales and interest in the brand's products over the last 30 days. */
  async analytics(userId: string) {
    const brand = await this.requireOwn(userId);
    const paid = `('paid','shipped','delivered')`;
    const [daily, byStatus, topProducts, interest, catalogue] = await Promise.all([
      this.dataSource.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(sum(o.total), 0)::int AS revenue, count(o.id)::int AS orders
         FROM generate_series(current_date - 29, current_date, interval '1 day') AS d(day)
         LEFT JOIN orders o ON o.brand_id = $1 AND o.status IN ${paid} AND o.paid_at::date = d.day
         GROUP BY d.day ORDER BY d.day`,
        [brand.id],
      ),
      this.dataSource.query(
        `SELECT status, count(*)::int AS count FROM orders WHERE brand_id = $1 GROUP BY status`,
        [brand.id],
      ),
      this.dataSource.query(
        `SELECT i.product_id AS "productId", i.title, max(i.image) AS image, sum(i.quantity)::int AS units, sum(i.quantity * i.unit_price)::int AS revenue
         FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE o.brand_id = $1 AND o.status IN ${paid}
         GROUP BY i.product_id, i.title ORDER BY units DESC LIMIT 5`,
        [brand.id],
      ),
      this.dataSource.query(
        `SELECT
           (SELECT count(*)::int FROM saved_products s JOIN products p ON p.id = s.product_id WHERE p.brand_id = $1) AS "wishlistSaves",
           (SELECT count(*)::int FROM try_ons t JOIN products p ON p.id = t.product_id WHERE p.brand_id = $1) AS "tryOns",
           (SELECT count(*)::int FROM outfit_items i JOIN products p ON p.id = i.product_id WHERE p.brand_id = $1 AND i.suggestion_id IS NOT NULL) AS "stylistPicks"`,
        [brand.id],
      ),
      this.dataSource.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE is_active AND NOT hidden_by_brand)::int AS visible,
                count(*) FILTER (WHERE external_id IS NULL)::int AS manual
         FROM products WHERE brand_id = $1`,
        [brand.id],
      ),
    ]);
    const revenue30d = (daily as { revenue: number }[]).reduce((sum, row) => sum + row.revenue, 0);
    const orders30d = (daily as { orders: number }[]).reduce((sum, row) => sum + row.orders, 0);
    return {
      revenue30d,
      orders30d,
      daily,
      byStatus,
      topProducts,
      interest: interest[0],
      catalogue: catalogue[0],
    };
  }

  /** Brands without an owner, for the admin's "link brand" list. */
  unclaimed(): Promise<Brand[]> {
    return this.brands.find({ where: { ownerId: IsNull() }, order: { name: 'ASC' } });
  }
}
