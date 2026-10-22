export const GEOCODER = Symbol('GEOCODER');

export interface Place {
  lat: number;
  lng: number;
  label: string;
}

/** Turns an address into map coordinates. Bound to OpenStreetMap Nominatim. */
export interface Geocoder {
  /** Best matches in Pakistan, best first (empty when nothing matches). */
  search(query: string, limit?: number): Promise<Place[]>;
}
