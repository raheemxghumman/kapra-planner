import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { OutfitSlot } from '../../catalogue/catalogue.enums.js';
import { ProductVariant } from '../../catalogue/entities/product-variant.entity.js';
import { Product } from '../../catalogue/entities/product.entity.js';
import { Outfit } from './outfit.entity.js';
import { OutfitSuggestion } from './outfit-suggestion.entity.js';

/**
 * One piece in a look. It belongs either to a suggestion (what the stylist proposed) or to a
 * saved outfit (the customer's copy, which they can change without touching the suggestion).
 */
@Entity('outfit_items')
export class OutfitItem extends BaseEntity {
  @ManyToOne(() => OutfitSuggestion, (suggestion) => suggestion.items, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'suggestion_id' })
  suggestion: Relation<OutfitSuggestion> | null;

  @Index()
  @Column({ name: 'suggestion_id', type: 'uuid', nullable: true })
  suggestionId: string | null;

  @ManyToOne(() => Outfit, (outfit) => outfit.items, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outfit_id' })
  outfit: Relation<Outfit> | null;

  @Index()
  @Column({ name: 'outfit_id', type: 'uuid', nullable: true })
  outfitId: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant: Relation<ProductVariant> | null;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string | null;

  @Column({ type: 'enum', enum: OutfitSlot, enumName: 'outfit_slot' })
  slot: OutfitSlot;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null;

  @Column({ type: 'smallint', default: 0 })
  position: number;
}
