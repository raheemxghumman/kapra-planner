import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Webhook events already handled. Stripe may send an event more than once; we act once. */
@Entity('stripe_events')
export class StripeEvent {
  @PrimaryColumn({ name: 'event_id', length: 100 })
  eventId: string;

  @Column({ length: 60 })
  type: string;

  @CreateDateColumn({ name: 'processed_at', type: 'timestamptz' })
  processedAt: Date;
}
