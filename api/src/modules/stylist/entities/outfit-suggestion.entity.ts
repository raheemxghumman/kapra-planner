import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { OutfitItem } from './outfit-item.entity.js';
import { StylistRequest } from './stylist-request.entity.js';

/** One complete look the stylist proposed for a request (2-3 per request). */
@Entity('outfit_suggestions')
export class OutfitSuggestion extends BaseEntity {
  @ManyToOne(() => StylistRequest, (request) => request.suggestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: Relation<StylistRequest>;

  @Index()
  @Column({ name: 'request_id' })
  requestId: string;

  @Column({ length: 80 })
  title: string;

  @Column({ type: 'varchar', length: 400 })
  reason: string;

  @Column({ name: 'total_price', type: 'int' })
  totalPrice: number;

  @Column({ type: 'smallint' })
  rank: number;

  @OneToMany(() => OutfitItem, (item) => item.suggestion, { cascade: true })
  items: Relation<OutfitItem>[];
}
