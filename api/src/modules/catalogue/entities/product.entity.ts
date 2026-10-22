import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Brand } from '../../brands/entities/brand.entity.js';
import { Gender, Occasion, ProductCategory, WearStyle } from '../catalogue.enums.js';
import { ProductVariant } from './product-variant.entity.js';

@Entity('products')
@Index(['brandId', 'externalId'], { unique: true })
@Index(['category', 'gender', 'isActive'])
@Index(['price'])
export class Product extends BaseEntity {
  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: Relation<Brand>;

  @Column({ name: 'brand_id' })
  brandId: string;

  /** ID in the brand's own system (feed); null for products added in the brand panel. */
  @Column({ name: 'external_id', type: 'varchar', length: 64, nullable: true })
  externalId: string | null;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Label as the brand wrote it ("RTW", "Eastern Top"), kept for reference. */
  @Column({ name: 'brand_category', type: 'varchar', length: 80, nullable: true })
  brandCategory: string | null;

  @Column({ type: 'enum', enum: ProductCategory, enumName: 'product_category' })
  category: ProductCategory;

  @Column({ type: 'enum', enum: Gender, enumName: 'product_gender' })
  gender: Gender;

  @Column({ type: 'enum', enum: WearStyle, enumName: 'wear_style' })
  style: WearStyle;

  @Column({ type: 'text', array: true, default: '{}' })
  colours: string[];

  @Column({ type: 'enum', enum: Occasion, enumName: 'occasion', array: true, default: '{}' })
  occasions: Occasion[];

  @Column({ type: 'varchar', length: 60, nullable: true })
  fabric: string | null;

  /** Price in whole rupees (integers avoid floating-point rounding errors). */
  @Column({ type: 'int' })
  price: number;

  /** Original price when the product is on sale. */
  @Column({ name: 'compare_at_price', type: 'int', nullable: true })
  compareAtPrice: number | null;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ name: 'product_url', type: 'varchar', length: 400, nullable: true })
  productUrl: string | null;

  /** Hidden products stay in the database (old outfits still show them) but are not sold. */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /** True once the AI tagger has refined colours, occasions and category. */
  @Column({ name: 'ai_tagged', default: false })
  aiTagged: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants: Relation<ProductVariant>[];
}
