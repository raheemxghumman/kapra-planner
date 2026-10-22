import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { TailorProfile } from './tailor-profile.entity.js';

/** A customer's rating and comment for a tailor, left after a completed booking. */
@Entity('reviews')
export class Review extends BaseEntity {
  @ManyToOne(() => TailorProfile, (tailor) => tailor.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tailor_id' })
  tailor: Relation<TailorProfile>;

  @Index()
  @Column({ name: 'tailor_id' })
  tailorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<User>;

  @Column({ name: 'customer_id' })
  customerId: string;

  /** One review per booking. Null only for seeded demo reviews. */
  @Index({ unique: true, where: 'booking_id IS NOT NULL' })
  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comment: string | null;

  /** 0 (negative) to 1 (positive), set by the sentiment job from the comment text. */
  @Column({ name: 'sentiment_score', type: 'double precision', nullable: true })
  sentimentScore: number | null;

  @Column({ name: 'sentiment_label', type: 'varchar', length: 10, nullable: true })
  sentimentLabel: 'positive' | 'neutral' | 'negative' | null;

  /** Hidden by an admin (abusive or fake); hidden reviews do not count towards ranking. */
  @Column({ name: 'is_hidden', default: false })
  isHidden: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reply: string | null;

  @Column({ name: 'replied_at', type: 'timestamptz', nullable: true })
  repliedAt: Date | null;
}
