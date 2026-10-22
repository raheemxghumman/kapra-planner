import { locateAddress } from './locate-address.js';

/** A fake geocoder that only knows one query; `search` is the spy the tests count. */
const knows = (query: string) => {
  const search = vi.fn((q: string) =>
    Promise.resolve(q === query ? [{ lat: 33.72, lng: 73.05, label: q }] : []),
  );
  return { geocoder: { search }, search };
};

describe('locateAddress', () => {
  it('uses the full address when the map knows it', async () => {
    const { geocoder, search } = knows('F-7 Markaz, Islamabad');
    expect(await locateAddress(geocoder, 'F-7 Markaz', 'Islamabad')).toMatchObject({ lat: 33.72 });
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('drops the most specific parts until something matches', async () => {
    const { geocoder, search } = knows('F-7 Markaz, Islamabad');
    const place = await locateAddress(
      geocoder,
      'Shop 14, Jinnah Super Market, F-7 Markaz',
      'Islamabad',
    );
    expect(place?.label).toBe('F-7 Markaz, Islamabad');
    expect(search).toHaveBeenCalledTimes(3);
  });

  it('returns null when nothing matches', async () => {
    expect(await locateAddress(knows('nowhere').geocoder, 'Unknown Lane', 'Islamabad')).toBeNull();
  });
});
