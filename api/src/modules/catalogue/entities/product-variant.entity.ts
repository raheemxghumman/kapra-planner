import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from './product.entity.js';

/** One size of a product. Synced variants are matched by their feed ID, never deleted. */
@Entity('product_variants')
@Index(['productId', 'externalId'], { unique: true })
export class ProductVariant extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'external_id', type: 'varchar', length: 64, nullable: true })
  externalId: string | null;

  /** "S", "M", "L", "38", "Free size"... */
  @Column({ length: 40 })
  size: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sku: string | null;

  /**
   * Brand feeds only say "available or not", so for synced products stock_qty is null and
   * in_stock comes from the feed. Brands managing stock in our panel set exact quantities.
   */
  @Column({ name: 'in_stock', default: true })
  inStock: boolean;

  @Column({ name: 'stock_qty', type: 'int', nullable: true })
  stockQty: number | null;
}
