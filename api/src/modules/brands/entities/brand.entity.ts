import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { BrandTier, Gender, WearStyle } from '../../catalogue/catalogue.enums.js';
import { User } from '../../users/entities/user.entity.js';
import { BrandStore } from './brand-store.entity.js';

/** Result of the last catalogue sync, shown to admins. */
export interface SyncReport {
  startedAt: string;
  finishedAt: string;
  fetched: number;
  created: number;
  updated: number;
  hidden: number;
  skipped: number;
  error?: string;
}

@Entity('brands')
export class Brand extends BaseEntity {
  /**
   * The brand manager's account. Brands imported from public catalogues have no owner
   * until the brand signs up and an admin links the account.
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User> | null;

  @Index({ unique: true, where: 'owner_id IS NOT NULL' })
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ length: 80 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 80 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website: string | null;

  /** Public product feed; brands without one manage products in the brand panel. */
  @Column({ name: 'feed_url', type: 'varchar', length: 300, nullable: true })
  feedUrl: string | null;

  /** Some feeds report prices in paisa; divide by this to get rupees. */
  @Column({ name: 'price_divisor', type: 'smallint', default: 1 })
  priceDivisor: number;

  @Column({ type: 'enum', enum: BrandTier, enumName: 'brand_tier', default: BrandTier.HighStreet })
  tier: BrandTier;

  /** Used when a product's own text does not say who or what it is for. */
  @Column({ name: 'default_gender', type: 'enum', enum: Gender, enumName: 'product_gender', default: Gender.Women })
  defaultGender: Gender;

  @Column({ name: 'default_style', type: 'enum', enum: WearStyle, enumName: 'wear_style', default: WearStyle.Eastern })
  defaultStyle: WearStyle;

  /** Only verified brands appear in the catalogue and the stylist. */
  @Column({ default: false })
  verified: boolean;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ name: 'last_sync_report', type: 'jsonb', nullable: true })
  lastSyncReport: SyncReport | null;

  @OneToMany(() => BrandStore, (store) => store.brand)
  stores: Relation<BrandStore>[];
}
