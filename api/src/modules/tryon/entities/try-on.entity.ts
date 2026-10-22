import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../catalogue/entities/product.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { PersonPhoto } from './person-photo.entity.js';

export enum TryOnStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

/** One "show me in this piece" job. Runs in the background; the client polls its status. */
@Entity('try_ons')
@Index(['photoId', 'productId'])
export class TryOn extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => PersonPhoto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo: Relation<PersonPhoto>;

  @Column({ name: 'photo_id' })
  photoId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({
    type: 'enum',
    enum: TryOnStatus,
    enumName: 'try_on_status',
    default: TryOnStatus.Pending,
  })
  status: TryOnStatus;

  @Column({ type: 'varchar', length: 30, nullable: true })
  provider: string | null;

  @Column({ name: 'result_url', type: 'varchar', length: 500, nullable: true })
  resultUrl: string | null;

  @Column({ name: 'result_public_id', type: 'varchar', length: 200, nullable: true })
  resultPublicId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  error: string | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;
}
