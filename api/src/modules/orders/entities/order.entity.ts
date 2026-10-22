import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Brand } from '../../brands/entities/brand.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { OrderStatus } from '../order-status.js';
import { OrderItem } from './order-item.entity.js';

/** A customer's purchase from one partner brand. Prices are copied in at checkout. */
@Entity('orders')
export class Order extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 12 })
  code: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<User>;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: Relation<Brand>;

  @Index()
  @Column({ name: 'brand_id' })
  brandId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
    default: OrderStatus.PendingPayment,
  })
  status: OrderStatus;

  @Column({ type: 'int' })
  subtotal: number;

  @Column({ name: 'shipping_fee', type: 'int' })
  shippingFee: number;

  @Column({ type: 'int' })
  total: number;

  @Column({ name: 'ship_name', length: 80 })
  shipName: string;

  @Column({ name: 'ship_phone', length: 20 })
  shipPhone: string;

  @Column({ name: 'ship_address', length: 200 })
  shipAddress: string;

  @Column({ name: 'ship_city', length: 60 })
  shipCity: string;

  @Column({ name: 'tracking_number', type: 'varchar', length: 60, nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'cancel_reason', type: 'varchar', length: 300, nullable: true })
  cancelReason: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'shipped_at', type: 'timestamptz', nullable: true })
  shippedAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: Relation<OrderItem>[];
}
