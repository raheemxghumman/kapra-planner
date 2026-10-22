import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { BookingStatus, type BookingActor } from '../booking-status.js';
import { Booking } from './booking.entity.js';

/** One step in a booking's tracking timeline ("Accepted by the tailor - 3 Nov, 4:10 pm"). */
@Entity('booking_events')
export class BookingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, (booking) => booking.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Relation<Booking>;

  @Index()
  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ type: 'enum', enum: BookingStatus, enumName: 'booking_status' })
  status: BookingStatus;

  @Column({ type: 'varchar', length: 10 })
  actor: BookingActor;

  @Column({ type: 'varchar', length: 300, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
