/**
 * How Kapra picks the "best" tailor. Pure functions, so the maths is unit tested and easy to
 * explain. Every part is scaled to 0..1 and the score is a weighted sum:
 *
 *   score = 0.55 x rating  +  0.30 x review sentiment  +  0.15 x completion rate
 *
 * - rating: a Bayesian average, so one 5-star review does not beat fifty 4.8-star reviews.
 * - sentiment: what customers wrote, scored by a pre-trained multilingual model
 *   (nlptown/bert-base-multilingual-uncased-sentiment). Falls back to the rating when no
 *   comment has been scored yet.
 * - completion: share of bookings finished rather than cancelled (assumed 0.9 until there
 *   are 3 bookings).
 */

export const WEIGHTS = { rating: 0.55, sentiment: 0.3, completion: 0.15 } as const;

/** How many "average" reviews every tailor starts with (the Bayesian prior's weight). */
export const PRIOR_REVIEWS = 5;
export const DEFAULT_COMPLETION = 0.9;
const MIN_BOOKINGS_FOR_COMPLETION = 3;

export interface RankingInput {
  ratingAvg: number;
  ratingCount: number;
  sentimentAvg: number | null;
  completedOrders: number;
  cancelledOrders: number;
}

/** (C x m + sum of ratings) / (C + n): pulls tailors with few reviews towards the global mean m. */
export function bayesianRating(avg: number, count: number, globalMean: number): number {
  return (PRIOR_REVIEWS * globalMean + avg * count) / (PRIOR_REVIEWS + count);
}

/** 1..5 stars -> 0..1. */
export const starsToUnit = (stars: number) => Math.min(Math.max((stars - 1) / 4, 0), 1);

export function completionRate(completed: number, cancelled: number): number {
  const total = completed + cancelled;
  return total < MIN_BOOKINGS_FOR_COMPLETION ? DEFAULT_COMPLETION : completed / total;
}

export function rankScore(input: RankingInput, globalMean: number): number {
  const rating = starsToUnit(bayesianRating(input.ratingAvg, input.ratingCount, globalMean));
  const sentiment = input.sentimentAvg ?? rating;
  const completion = completionRate(input.completedOrders, input.cancelledOrders);
  const score =
    WEIGHTS.rating * rating + WEIGHTS.sentiment * sentiment + WEIGHTS.completion * completion;
  return Math.round(score * 10_000) / 10_000;
}

/**
 * The model returns a probability for each of 1..5 stars; the expected number of stars,
 * scaled to 0..1, is the sentiment score. E.g. 70% "5 stars" + 30% "4 stars" -> 4.7 -> 0.925.
 */
export function sentimentFromStars(probabilities: { stars: number; score: number }[]): number {
  const total = probabilities.reduce((sum, p) => sum + p.score, 0) || 1;
  const expected = probabilities.reduce((sum, p) => sum + p.stars * p.score, 0) / total;
  return Math.round(starsToUnit(expected) * 1000) / 1000;
}

export function sentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
  if (score >= 0.6) return 'positive';
  if (score <= 0.4) return 'negative';
  return 'neutral';
}

/** Great-circle distance in km between two points (used in tests; SQL uses the same formula). */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
