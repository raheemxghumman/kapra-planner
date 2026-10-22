import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** An in-app notification (the bell icon). Stored so it survives page reloads. */
@Entity('notifications')
@Index(['userId', 'createdAt'])
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'user_id' })
  userId: string;

  /** e.g. "booking.accepted", "message.new". */
  @Column({ length: 40 })
  type: string;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  body: string | null;

  /** Frontend path to open, e.g. "/app/bookings/123". */
  @Column({ type: 'varchar', length: 200, nullable: true })
  link: string | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
