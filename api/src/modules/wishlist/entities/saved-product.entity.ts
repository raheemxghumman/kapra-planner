import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Product } from '../../catalogue/entities/product.entity.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * A product on a customer's wishlist. The primary key is (user, product), so the same
 * product cannot be saved twice and no separate id is needed.
 */
@Entity('saved_products')
export class SavedProduct {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
