import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** Postgres returns numeric columns as strings; this converts them back to numbers. */
const decimal = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

const measure = (name: string) =>
  Column({ name, type: 'numeric', precision: 5, scale: 1, nullable: true, transformer: decimal });

/**
 * A named set of body measurements in inches ("My measurements", "Ammi's suit"),
 * sent to the tailor with every booking.
 */
@Entity('measurement_profiles')
export class MeasurementProfile extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 60 })
  label: string;

  @measure('chest')
  chest: number | null;

  @measure('waist')
  waist: number | null;

  @measure('hips')
  hips: number | null;

  @measure('shoulder')
  shoulder: number | null;

  @measure('sleeve_length')
  sleeveLength: number | null;

  @measure('shirt_length')
  shirtLength: number | null;

  @measure('trouser_length')
  trouserLength: number | null;

  @measure('neck')
  neck: number | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  notes: string | null;
}
