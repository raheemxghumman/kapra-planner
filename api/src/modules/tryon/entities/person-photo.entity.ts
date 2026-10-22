import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** A full-length photo the customer uploaded for try-on. Deleting it also deletes the file. */
@Entity('person_photos')
export class PersonPhoto extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 500 })
  url: string;

  @Column({ name: 'public_id', length: 200 })
  publicId: string;
}
