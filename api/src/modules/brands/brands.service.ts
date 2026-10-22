import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto.js';
import { Brand } from './entities/brand.entity.js';

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  tier: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  productCount: number;
  /** Sells on Kapra (an approved brand account manages it); otherwise catalogue only. */
  partner: boolean;
}

export interface StorePin {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  brandName: string;
  brandSlug: string;
  logoUrl: string | null;
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

@Injectable()
export class BrandsService {
  constructor(@InjectRepository(Brand) private readonly brands: Repository<Brand>) {}

  /** Verified brands with how many active products each has. */
  listPublic(): Promise<BrandSummary[]> {
    return this.brands
      .createQueryBuilder('brand')
      .leftJoin('products', 'p', 'p.brand_id = brand.id AND p.is_active')
      .select([
        'brand.id AS id',
        'brand.name AS name',
        'brand.slug AS slug',
        'brand.tier AS tier',
        'brand.description AS description',
        'brand.website AS website',
        'brand.logo_url AS "logoUrl"',
        'count(p.id)::int AS "productCount"',
        '(brand.owner_id IS NOT NULL) AS partner',
      ])
      .where('brand.verified = true')
      .groupBy('brand.id')
      .orderBy('brand.name')
      .getRawMany<BrandSummary>();
  }

  /** Every store of a verified brand, for the map. */
  stores(): Promise<StorePin[]> {
    return this.brands.manager.query(
      `SELECT s.id, s.name, s.address, s.city, s.lat, s.lng,
              b.name AS "brandName", b.slug AS "brandSlug", b.logo_url AS "logoUrl"
       FROM brand_stores s JOIN brands b ON b.id = s.brand_id
       WHERE b.verified ORDER BY b.name, s.name`,
    );
  }

  async findBySlug(slug: string): Promise<Brand> {
    const brand = await this.brands.findOne({
      where: { slug, verified: true },
      relations: { stores: true },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  /** Admin view: every brand, including unverified ones and their last sync report. */
  listAll(): Promise<Brand[]> {
    return this.brands.find({ order: { name: 'ASC' }, relations: { owner: true } });
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const slug = slugify(dto.name);
    if (await this.brands.existsBy({ slug })) {
      throw new ConflictException('A brand with this name already exists');
    }
    const brand = this.brands.create(dto);
    brand.slug = slug;
    return this.brands.save(brand);
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brands.findOneBy({ id });
    if (!brand) throw new NotFoundException('Brand not found');
    Object.assign(brand, dto);
    return this.brands.save(brand);
  }
}
