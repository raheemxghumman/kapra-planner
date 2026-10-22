import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { OutfitSuggestion } from './outfit-suggestion.entity.js';

/** A like or dislike on a suggestion; the stylist avoids disliked products next time. */
@Entity('suggestion_feedback')
@Index(['suggestionId', 'userId'], { unique: true })
export class SuggestionFeedback extends BaseEntity {
  @ManyToOne(() => OutfitSuggestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'suggestion_id' })
  suggestion: Relation<OutfitSuggestion>;

  @Column({ name: 'suggestion_id' })
  suggestionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  liked: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null;
}
