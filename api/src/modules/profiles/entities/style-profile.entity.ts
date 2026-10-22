import { Column, Entity, Index, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Gender, WearStyle } from '../../catalogue/catalogue.enums.js';
import { User } from '../../users/entities/user.entity.js';

/** Usual sizes per kind of piece, e.g. { top: "M", bottom: "M", shoes: "38" }. */
export interface SizeMap {
  top?: string;
  bottom?: string;
  shoes?: string;
}

/** What a customer usually wants; pre-fills every stylist request. One per customer. */
@Entity('style_profiles')
export class StyleProfile extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: Gender, enumName: 'product_gender', default: Gender.Women })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: WearStyle,
    enumName: 'wear_style',
    array: true,
    default: '{eastern}',
  })
  styles: WearStyle[];

  @Column({ type: 'jsonb', default: {} })
  sizes: SizeMap;

  @Column({ name: 'favourite_colours', type: 'text', array: true, default: '{}' })
  favouriteColours: string[];

  @Column({ name: 'avoid_colours', type: 'text', array: true, default: '{}' })
  avoidColours: string[];

  @Column({ name: 'budget_min', type: 'int', default: 3000 })
  budgetMin: number;

  @Column({ name: 'budget_max', type: 'int', default: 15000 })
  budgetMax: number;
}
