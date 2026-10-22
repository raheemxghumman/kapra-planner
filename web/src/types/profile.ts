import type { Gender, WearStyle } from './catalogue';

export interface SizeMap {
  top?: string;
  bottom?: string;
  shoes?: string;
}

export interface StyleProfile {
  id: string;
  gender: Gender;
  styles: WearStyle[];
  sizes: SizeMap;
  favouriteColours: string[];
  avoidColours: string[];
  budgetMin: number;
  budgetMax: number;
}

export const MEASUREMENT_FIELDS = [
  ['chest', 'Chest'],
  ['waist', 'Waist'],
  ['hips', 'Hips'],
  ['shoulder', 'Shoulder'],
  ['sleeveLength', 'Sleeve length'],
  ['shirtLength', 'Shirt length'],
  ['trouserLength', 'Trouser length'],
  ['neck', 'Neck'],
] as const;

export type MeasurementKey = (typeof MEASUREMENT_FIELDS)[number][0];

export type Measurement = {
  id: string;
  label: string;
  notes: string | null;
  createdAt: string;
} & Record<MeasurementKey, number | null>;

export type MeasurementInput = { label: string; notes?: string } & Partial<Record<MeasurementKey, number | null>>;
