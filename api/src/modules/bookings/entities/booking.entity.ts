import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../catalogue/entities/product.entity.js';
import { Outfit } from '../../stylist/entities/outfit.entity.js';
import { TailorProfile } from '../../tailors/entities/tailor-profile.entity.js';
import { TailorService } from '../../tailors/entities/tailor-service.entity.js';
import { TryOn } from '../../tryon/entities/try-on.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { BookingStatus } from '../booking-status.js';
import { BookingEvent } from './booking-event.entity.js';

export enum Handoff {
  /** The customer brings the fabric to the shop. */
  DropOff = 'drop_off',
  /** The tailor visits to take measurements and collect the fabric. */
  HomeVisit = 'home_visit',
}

export interface MeasurementSnapshot {
  label: string;
  values: Record<string, number | null>;
  notes: string | null;
}

/** A customer's order with a tailor: what to stitch, measurements, price and progress. */
@Entity('bookings')
export class Booking extends BaseEntity {
  /** Short code shown to people, e.g. "KP-7F3A2C". */
  @Index({ unique: true })
  @Column({ length: 12 })
  code: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<User>;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => TailorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tailor_id' })
  tailor: Relation<TailorProfile>;

  @Index()
  @Column({ name: 'tailor_id' })
  tailorId: string;

  @ManyToOne(() => TailorService, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: Relation<TailorService> | null;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  /** Copied at booking time, so later price changes do not change this booking. */
  @Column({ name: 'service_name', length: 80 })
  serviceName: string;

  @Column({ type: 'int' })
  price: number;

  @Index()
  @Column({
    type: 'enum',
    enum: BookingStatus,
    enumName: 'booking_status',
    default: BookingStatus.PendingPayment,
  })
  status: BookingStatus;

  @Column({ type: 'enum', enum: Handoff, enumName: 'booking_handoff' })
  handoff: Handoff;

  /** Drop-off or home-visit time. */
  @Column({ name: 'appointment_at', type: 'timestamptz' })
  appointmentAt: Date;

  /** Customer's address, only for home visits. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string | null;

  /** Copy of the measurement profile at booking time. */
  @Column({ type: 'jsonb', nullable: true })
  measurements: MeasurementSnapshot | null;

  // ---- What to stitch (all optional): a catalogue piece, a saved outfit or a try-on result ----

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product> | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Outfit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'outfit_id' })
  outfit: Relation<Outfit> | null;

  @Column({ name: 'outfit_id', type: 'uuid', nullable: true })
  outfitId: string | null;

  @ManyToOne(() => TryOn, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'try_on_id' })
  tryOn: Relation<TryOn> | null;

  @Column({ name: 'try_on_id', type: 'uuid', nullable: true })
  tryOnId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  /** Set when the tailor accepts: today + the service's duration. */
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  /** Why the tailor declined or the customer cancelled. */
  @Column({ name: 'closing_reason', type: 'varchar', length: 300, nullable: true })
  closingReason: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => BookingEvent, (event) => event.booking)
  events: Relation<BookingEvent>[];
}
