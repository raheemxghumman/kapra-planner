import { Column, Entity, Index, JoinColumn, OneToMany, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { TailorSpeciality } from '../tailors.enums.js';
import { Review } from './review.entity.js';
import { TailorService } from './tailor-service.entity.js';

export interface GalleryImage {
  url: string;
  publicId: string;
}

/** A tailor's shop: where it is, what it does, and the numbers used to rank it. */
@Entity('tailor_profiles')
@Index(['lat', 'lng'])
export class TailorProfile extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'business_name', length: 80 })
  businessName: string;

  @Index({ unique: true })
  @Column({ length: 90 })
  slug: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  bio: string | null;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 200 })
  address: string;

  @Index()
  @Column({ length: 60 })
  city: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({
    type: 'enum',
    enum: TailorSpeciality,
    enumName: 'tailor_speciality',
    array: true,
    default: '{}',
  })
  specialities: TailorSpeciality[];

  /** Cheapest service price, kept in sync with the services list (for "price" sorting). */
  @Column({ name: 'price_from', type: 'int', nullable: true })
  priceFrom: number | null;

  /** Usual days to finish an order. */
  @Column({ name: 'turnaround_days', type: 'smallint', default: 7 })
  turnaroundDays: number;

  /** Takes measurements at the customer's home. */
  @Column({ name: 'home_visits', default: false })
  homeVisits: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  gallery: GalleryImage[];

  // ---- Ranking inputs and result (recomputed by TailorRankingService) ----

  @Column({ name: 'rating_avg', type: 'double precision', default: 0 })
  ratingAvg: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  /** Average sentiment of review texts from the pre-trained model, 0 (negative) to 1 (positive). */
  @Column({ name: 'sentiment_avg', type: 'double precision', nullable: true })
  sentimentAvg: number | null;

  @Column({ name: 'completed_orders', type: 'int', default: 0 })
  completedOrders: number;

  @Column({ name: 'cancelled_orders', type: 'int', default: 0 })
  cancelledOrders: number;

  @Index()
  @Column({ name: 'rank_score', type: 'double precision', default: 0 })
  rankScore: number;

  @OneToMany(() => TailorService, (service) => service.tailor)
  services: Relation<TailorService>[];

  @OneToMany(() => Review, (review) => review.tailor)
  reviews: Relation<Review>[];
}
