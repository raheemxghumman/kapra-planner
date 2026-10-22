import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  /** Refund requested; waiting for Stripe (or approval in the Stripe dashboard). */
  RefundPending = 'refund_pending',
  Refunded = 'refunded',
  Failed = 'failed',
}

/** What a payment is for; the matching module listens for "payment.paid" events. */
export enum PaymentPurpose {
  Booking = 'booking',
  Order = 'order',
}

/** One card payment through Stripe, for a tailor booking or a product order. */
@Entity('payments')
@Index(['purpose', 'referenceId'])
export class Payment extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: PaymentPurpose, enumName: 'payment_purpose' })
  purpose: PaymentPurpose;

  /** The booking or order id. */
  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId: string;

  /** Rupees. */
  @Column({ type: 'int' })
  amount: number;

  @Column({ length: 3, default: 'PKR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'payment_status',
    default: PaymentStatus.Pending,
  })
  status: PaymentStatus;

  @Index({ unique: true, where: 'stripe_session_id IS NOT NULL' })
  @Column({ name: 'stripe_session_id', type: 'varchar', length: 200, nullable: true })
  stripeSessionId: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 100, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'stripe_refund_id', type: 'varchar', length: 100, nullable: true })
  stripeRefundId: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt: Date | null;
}
