import { Column, Entity, Index, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { GarmentFit } from '../cutouts/garment-geometry.js';
import { Product } from './product.entity.js';

export enum CutoutStatus {
  Ready = 'ready',
  /** Checked and not usable (no suitable photo); the job does not retry it. */
  Rejected = 'rejected',
}

export enum CutoutSource {
  FlatLay = 'flat_lay',
  OnModel = 'on_model',
}

/**
 * Transparent cut-out of a product for live (AR) try-on, made by the cut-out job
 * (src/jobs/make-cutouts.ts) with a clothes-segmentation model. One row per product.
 */
@Entity('garment_cutouts')
@Index(['productId'], { unique: true })
export class GarmentCutout extends BaseEntity {
  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'enum', enum: CutoutStatus, enumName: 'cutout_status' })
  status: CutoutStatus;

  @Column({ type: 'enum', enum: CutoutSource, enumName: 'cutout_source', nullable: true })
  source: CutoutSource | null;

  /** The product photo the cut-out was made from. */
  @Column({ name: 'source_image', type: 'varchar', length: 500, nullable: true })
  sourceImage: string | null;

  @Column({ name: 'cutout_url', type: 'varchar', length: 500, nullable: true })
  cutoutUrl: string | null;

  @Column({ name: 'cutout_public_id', type: 'varchar', length: 200, nullable: true })
  cutoutPublicId: string | null;

  /** Where the garment's shoulders (or waistband) are in the cut-out; see GarmentFit. */
  @Column({ type: 'jsonb', nullable: true })
  fit: GarmentFit | null;

  /** 0 to 1; how clean and complete the cut-out is. */
  @Column({ type: 'real', default: 0 })
  quality: number;

  /** Why no cut-out could be made (for rejected rows). */
  @Column({ type: 'varchar', length: 200, nullable: true })
  problem: string | null;
}
