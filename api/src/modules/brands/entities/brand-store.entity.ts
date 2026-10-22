import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Brand } from './brand.entity.js';

/** A physical shop of a brand, shown as a pin on the map. */
@Entity('brand_stores')
export class BrandStore extends BaseEntity {
  @ManyToOne(() => Brand, (brand) => brand.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: Relation<Brand>;

  @Index()
  @Column({ name: 'brand_id' })
  brandId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 250 })
  address: string;

  @Column({ length: 60 })
  city: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'opening_hours', type: 'varchar', length: 120, nullable: true })
  openingHours: string | null;
}
