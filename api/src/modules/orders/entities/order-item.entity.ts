import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { ProductVariant } from '../../catalogue/entities/product-variant.entity.js';
import { Product } from '../../catalogue/entities/product.entity.js';
import { Order } from './order.entity.js';

/** One line of an order. Title, size, image and price are copies, so the order never changes. */
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product> | null;

  @Index()
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant: Relation<ProductVariant> | null;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string | null;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 40 })
  size: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ name: 'unit_price', type: 'int' })
  unitPrice: number;

  @Column({ type: 'smallint' })
  quantity: number;
}
