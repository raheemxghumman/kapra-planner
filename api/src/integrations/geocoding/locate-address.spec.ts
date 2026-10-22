import type { Geocoder } from './geocoder.types.js';
import { locateAddress } from './locate-address.js';

const knows = (query: string): Geocoder => ({
  search: vi.fn((q: string) => Promise.resolve(q === query ? [{ lat: 33.72, lng: 73.05, label: q }] : [])),
});

describe('locateAddress', () => {
  it('uses the full address when the map knows it', async () => {
    const geocoder = knows('F-7 Markaz, Islamabad');
    expect(await locateAddress(geocoder, 'F-7 Markaz', 'Islamabad')).toMatchObject({ lat: 33.72 });
    expect(geocoder.search).toHaveBeenCalledTimes(1);
  });

  it('drops the most specific parts until something matches', async () => {
    const geocoder = knows('F-7 Markaz, Islamabad');
    const place = await locateAddress(geocoder, 'Shop 14, Jinnah Super Market, F-7 Markaz', 'Islamabad');
    expect(place?.label).toBe('F-7 Markaz, Islamabad');
    expect(geocoder.search).toHaveBeenCalledTimes(3);
  });

  it('returns null when nothing matches', async () => {
    expect(await locateAddress(knows('nowhere'), 'Unknown Lane', 'Islamabad')).toBeNull();
  });
});
