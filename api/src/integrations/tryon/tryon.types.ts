export const TRY_ON_PROVIDERS = Symbol('TRY_ON_PROVIDERS');

/** Which part of the body the garment covers; providers use it to choose a mask. */
export type GarmentType = 'upper' | 'lower' | 'full';

export interface TryOnInput {
  person: Blob;
  garment: Blob;
  garmentType: GarmentType;
  /** Short text such as "pink embroidered lawn kurta" (IDM-VTON uses it as a hint). */
  description: string;
}

/** One virtual try-on service. TryOnService tries them in order until one succeeds. */
export interface TryOnProvider {
  readonly name: string;
  /** Returns the generated image. Throws if the service is busy, out of quota or fails. */
  run(input: TryOnInput): Promise<Blob>;
}
