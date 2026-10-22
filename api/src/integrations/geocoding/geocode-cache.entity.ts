import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Saved Nominatim answers. The free service allows one request per second, so we ask once. */
@Entity('geocode_cache')
export class GeocodeCache {
  /** The normalised query ("gulberg iii, lahore"). */
  @PrimaryColumn({ length: 200 })
  query: string;

  @Column({ type: 'jsonb' })
  places: { lat: number; lng: number; label: string }[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
