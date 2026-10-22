import {
  bayesianRating,
  completionRate,
  haversineKm,
  rankScore,
  sentimentFromStars,
  sentimentLabel,
} from './tailor-ranking.js';

const base = {
  ratingAvg: 4.5,
  ratingCount: 20,
  sentimentAvg: 0.8,
  completedOrders: 20,
  cancelledOrders: 1,
};

describe('tailor ranking', () => {
  it('pulls tailors with few reviews towards the average', () => {
    expect(bayesianRating(5, 1, 4)).toBeCloseTo(4.17, 2);
    expect(bayesianRating(4.8, 50, 4)).toBeCloseTo(4.73, 2);
  });

  it('ranks fifty 4.8-star reviews above a single 5-star review', () => {
    const veteran = rankScore({ ...base, ratingAvg: 4.8, ratingCount: 50, sentimentAvg: null }, 4);
    const newcomer = rankScore({ ...base, ratingAvg: 5, ratingCount: 1, sentimentAvg: null }, 4);
    expect(veteran).toBeGreaterThan(newcomer);
  });

  it('lets negative review texts lower a tailor with the same stars', () => {
    expect(rankScore({ ...base, sentimentAvg: 0.9 }, 4)).toBeGreaterThan(
      rankScore({ ...base, sentimentAvg: 0.3 }, 4),
    );
  });

  it('penalises cancelled bookings only once there are enough bookings', () => {
    expect(completionRate(1, 1)).toBe(0.9);
    expect(completionRate(6, 4)).toBe(0.6);
    expect(rankScore({ ...base, cancelledOrders: 15 }, 4)).toBeLessThan(rankScore(base, 4));
  });

  it('turns star probabilities into a 0..1 sentiment', () => {
    expect(
      sentimentFromStars([
        { stars: 5, score: 0.7 },
        { stars: 4, score: 0.3 },
      ]),
    ).toBe(0.925);
    expect(sentimentFromStars([{ stars: 1, score: 1 }])).toBe(0);
    expect(sentimentLabel(0.925)).toBe('positive');
    expect(sentimentLabel(0.5)).toBe('neutral');
    expect(sentimentLabel(0.1)).toBe('negative');
  });

  it('measures distance between Lahore and Islamabad (~270 km)', () => {
    expect(haversineKm({ lat: 31.5204, lng: 74.3587 }, { lat: 33.6844, lng: 73.0479 })).toBeCloseTo(
      270,
      -1,
    );
  });
});
