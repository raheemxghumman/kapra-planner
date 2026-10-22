import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { ServiceType } from '../tailors.enums.js';
import { TailorProfile } from './tailor-profile.entity.js';

/** One priced job a tailor offers, e.g. "Shalwar kameez stitching - Rs 2,500 - 7 days". */
@Entity('tailor_services')
export class TailorService extends BaseEntity {
  @ManyToOne(() => TailorProfile, (tailor) => tailor.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tailor_id' })
  tailor: Relation<TailorProfile>;

  @Index()
  @Column({ name: 'tailor_id' })
  tailorId: string;

  @Column({ length: 80 })
  name: string;

  @Column({ type: 'enum', enum: ServiceType, enumName: 'service_type' })
  type: ServiceType;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description: string | null;

  @Column({ type: 'int' })
  price: number;

  @Column({ name: 'duration_days', type: 'smallint' })
  durationDays: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
