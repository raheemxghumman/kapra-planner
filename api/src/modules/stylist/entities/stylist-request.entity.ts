import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Occasion, WearStyle } from '../../catalogue/catalogue.enums.js';
import { User } from '../../users/entities/user.entity.js';
import { OutfitSuggestion } from './outfit-suggestion.entity.js';

export enum StylistRequestStatus {
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

/** One "style me for this occasion" request and how it went. */
@Entity('stylist_requests')
export class StylistRequest extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: Occasion, enumName: 'occasion' })
  occasion: Occasion;

  @Column({ type: 'int' })
  budget: number;

  @Column({ type: 'enum', enum: WearStyle, enumName: 'wear_style', nullable: true })
  style: WearStyle | null;

  @Column({ type: 'text', array: true, default: '{}' })
  colours: string[];

  @Column({ type: 'varchar', length: 300, nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: StylistRequestStatus,
    enumName: 'stylist_request_status',
    default: StylistRequestStatus.Running,
  })
  status: StylistRequestStatus;

  /** "ai" when the language model built the outfits, "rules" when the fallback did. */
  @Column({ type: 'varchar', length: 10, nullable: true })
  engine: 'ai' | 'rules' | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  error: string | null;

  @OneToMany(() => OutfitSuggestion, (suggestion) => suggestion.request)
  suggestions: Relation<OutfitSuggestion>[];
}
