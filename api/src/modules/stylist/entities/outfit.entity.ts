import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Occasion } from '../../catalogue/catalogue.enums.js';
import { User } from '../../users/entities/user.entity.js';
import { OutfitItem } from './outfit-item.entity.js';
import { OutfitSuggestion } from './outfit-suggestion.entity.js';

/** A look the customer saved (from a suggestion or built by hand), ready to try on or stitch. */
@Entity('outfits')
export class Outfit extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => OutfitSuggestion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'suggestion_id' })
  suggestion: Relation<OutfitSuggestion> | null;

  @Column({ name: 'suggestion_id', type: 'uuid', nullable: true })
  suggestionId: string | null;

  @Column({ length: 80 })
  name: string;

  @Column({ type: 'enum', enum: Occasion, enumName: 'occasion', nullable: true })
  occasion: Occasion | null;

  @OneToMany(() => OutfitItem, (item) => item.outfit, { cascade: true })
  items: Relation<OutfitItem>[];
}
