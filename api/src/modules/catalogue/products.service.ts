import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import { Gender } from './catalogue.enums.js';
import type { ProductQueryDto } from './dto/product-query.dto.js';
import { Product } from './entities/product.entity.js';

/** Columns a product card needs; the description and sizes load only on the detail page. */
const CARD_COLUMNS = [
  'product.id',
  'product.title',
  'product.price',
  'product.compareAtPrice',
  'product.images',
  'product.colours',
  'product.category',
  'product.gender',
  'product.style',
  'product.occasions',
  'product.fabric',
  'product.brandId',
  'product.createdAt',
  'brand.id',
  'brand.name',
  'brand.slug',
  'brand.tier',
];

export interface Facets {
  categories: { value: string; count: number }[];
  brands: { slug: string; name: string; count: number }[];
  colours: { value: string; count: number }[];
  priceRange: { min: number; max: number };
}

const FACETS_TTL_MS = 10 * 60_000;

/** "%" and "_" are wildcards in LIKE; escape them so a search for "50%" means 50%. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

@Injectable()
export class ProductsService {
  private facetsCache: { value: Facets; expiresAt: number } | null = null;

  constructor(@InjectRepository(Product) private readonly products: Repository<Product>) {}

  /** Active products of verified brands, as cards. */
  private baseQuery(): SelectQueryBuilder<Product> {
    return this.products
      .createQueryBuilder('product')
      .innerJoin('product.brand', 'brand')
      .select(CARD_COLUMNS)
      .where('product.isActive = true')
      .andWhere('brand.verified = true');
  }

  async search(query: ProductQueryDto): Promise<Paginated<Product>> {
    const qb = this.baseQuery();

    if (query.q) {
      qb.andWhere(
        '(product.title ILIKE :q OR product.brandCategory ILIKE :q OR product.fabric ILIKE :q OR brand.name ILIKE :q)',
        { q: `%${escapeLike(query.q.trim())}%` },
      );
    }
    if (query.brand?.length) qb.andWhere('brand.slug IN (:...brands)', { brands: query.brand });
    if (query.category?.length) qb.andWhere('product.category IN (:...categories)', { categories: query.category });
    if (query.gender) {
      // Unisex pieces suit everyone, so they appear in both the women's and men's results.
      const genders = query.gender === Gender.Unisex ? [Gender.Unisex] : [query.gender, Gender.Unisex];
      qb.andWhere('product.gender IN (:...genders)', { genders });
    }
    if (query.style) qb.andWhere('product.style = :style', { style: query.style });
    if (query.colour?.length) qb.andWhere('product.colours && ARRAY[:...colours]::text[]', { colours: query.colour });
    if (query.occasion?.length) {
      qb.andWhere('product.occasions && ARRAY[:...occasions]::occasion[]', { occasions: query.occasion });
    }
    if (query.minPrice !== undefined) qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    if (query.maxPrice !== undefined) qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    if (query.inStock || query.size) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = product.id AND v.in_stock = true
         ${query.size ? 'AND lower(v.size) = lower(:size)' : ''})`,
        { size: query.size },
      );
    }

    switch (query.sort) {
      case 'newest':
        qb.orderBy('product.createdAt', 'DESC');
        break;
      case 'price_asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('product.price', 'DESC');
        break;
      default:
        // "Featured": a shuffle that changes daily but stays stable while paging.
        qb.orderBy(`md5(product.id::text || :seed)`).setParameter('seed', new Date().toDateString());
    }
    qb.addOrderBy('product.id');

    // limit/offset (not take/skip): every join here is many-to-one, so rows cannot repeat, and
    // take/skip would wrap the query in SELECT DISTINCT, which cannot ORDER BY an expression.
    const [data, total] = await qb
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getManyAndCount();
    return paginate(data, total, query);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.products.findOne({
      where: { id, brand: { verified: true } },
      relations: { brand: true, variants: true },
      order: { variants: { createdAt: 'ASC' } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  /** Same kind of piece in a similar colour, used for "You may also like" and swaps. */
  async findSimilar(id: string, limit = 8): Promise<Product[]> {
    const product = await this.findById(id);
    return this.baseQuery()
      .andWhere('product.id != :id', { id })
      .andWhere('product.category = :category', { category: product.category })
      .andWhere('product.style = :style', { style: product.style })
      .andWhere('product.gender IN (:...genders)', { genders: [product.gender, Gender.Unisex] })
      .orderBy(
        product.colours.length ? `(product.colours && ARRAY[:...colours]::text[])` : 'product.id',
        'DESC',
      )
      .setParameter('colours', product.colours)
      .addOrderBy('abs(product.price - :price)', 'ASC')
      .setParameter('price', product.price)
      .limit(limit)
      .getMany();
  }

  /** A random selection with images, for the landing page and empty states. */
  featured(limit: number): Promise<Product[]> {
    return this.baseQuery()
      .andWhere("cardinality(product.images) >= 2")
      .andWhere("product.category IN ('kurta', 'dress', 'suit', 'top', 'unstitched')")
      .orderBy('random()')
      .limit(limit)
      .getMany();
  }

  /** Counts for the filter sidebar. Cached for 10 minutes because they change only on sync. */
  async facets(): Promise<Facets> {
    if (this.facetsCache && this.facetsCache.expiresAt > Date.now()) {
      return this.facetsCache.value;
    }
    const active = `FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.is_active AND b.verified`;
    const [categories, brands, colours, range] = await Promise.all([
      this.products.query(`SELECT p.category AS value, count(*)::int AS count ${active} GROUP BY 1 ORDER BY 2 DESC`),
      this.products.query(
        `SELECT b.slug, b.name, count(*)::int AS count ${active} GROUP BY 1, 2 ORDER BY b.name`,
      ),
      this.products.query(
        `SELECT c AS value, count(*)::int AS count ${active.replace('WHERE', ', unnest(p.colours) c WHERE')} GROUP BY 1 ORDER BY 2 DESC`,
      ),
      this.products.query(`SELECT coalesce(min(p.price), 0)::int AS min, coalesce(max(p.price), 0)::int AS max ${active}`),
    ]);
    const value: Facets = { categories, brands, colours, priceRange: range[0] };
    this.facetsCache = { value, expiresAt: Date.now() + FACETS_TTL_MS };
    return value;
  }

  clearFacetsCache(): void {
    this.facetsCache = null;
  }
}
