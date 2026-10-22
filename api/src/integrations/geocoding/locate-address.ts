import type { Geocoder, Place } from './geocoder.types.js';

/**
 * Finds an address, from most to least precise: the full address, then each later part of it
 * ("Shop 14, Jinnah Super, F-7 Markaz" -> "Jinnah Super, F-7 Markaz" -> "F-7 Markaz"), always
 * with the city. Pakistani shop addresses are often too specific for OpenStreetMap.
 */
export async function locateAddress(
  geocoder: Geocoder,
  address: string,
  city: string,
): Promise<Place | null> {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const attempts = parts.map((_, start) => `${parts.slice(start).join(', ')}, ${city}`);
  for (const query of attempts.slice(0, 3)) {
    const [place] = await geocoder.search(query, 1);
    if (place) return place;
  }
  return null;
}
