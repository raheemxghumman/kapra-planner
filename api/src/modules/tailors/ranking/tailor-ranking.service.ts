import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { rankScore } from './tailor-ranking.js';

/** Default prior when there are no reviews anywhere yet. */
const FALLBACK_MEAN = 4;

@Injectable()
export class TailorRankingService {
  private readonly logger = new Logger(TailorRankingService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Recomputes every tailor's review stats and rank score. Runs after each new review, after
   * the sentiment job and from POST /jobs/rank-tailors. Two queries plus one bulk update.
   */
  async recomputeAll(): Promise<number> {
    // 1. Review stats per tailor (hidden reviews do not count).
    await this.dataSource.query(`
      UPDATE tailor_profiles t SET
        rating_avg = COALESCE(s.avg, 0),
        rating_count = COALESCE(s.count, 0),
        sentiment_avg = s.sentiment
      FROM tailor_profiles t2
      LEFT JOIN (
        SELECT tailor_id, avg(rating)::float AS avg, count(*)::int AS count, avg(sentiment_score)::float AS sentiment
        FROM reviews WHERE is_hidden = false GROUP BY tailor_id
      ) s ON s.tailor_id = t2.id
      WHERE t.id = t2.id`);

    // 2. The global mean rating is the Bayesian prior.
    const [{ mean }] = await this.dataSource.query(
      `SELECT avg(rating)::float AS mean FROM reviews WHERE is_hidden = false`,
    );
    const globalMean: number = mean ?? FALLBACK_MEAN;

    // 3. Score each tailor with the pure formula and write all scores in one statement.
    const tailors: {
      id: string;
      rating_avg: number;
      rating_count: number;
      sentiment_avg: number | null;
      completed_orders: number;
      cancelled_orders: number;
    }[] = await this.dataSource.query(
      `SELECT id, rating_avg, rating_count, sentiment_avg, completed_orders, cancelled_orders FROM tailor_profiles`,
    );
    if (tailors.length === 0) return 0;

    const scores = tailors.map((tailor) =>
      rankScore(
        {
          ratingAvg: tailor.rating_avg,
          ratingCount: tailor.rating_count,
          sentimentAvg: tailor.sentiment_avg,
          completedOrders: tailor.completed_orders,
          cancelledOrders: tailor.cancelled_orders,
        },
        globalMean,
      ),
    );
    await this.dataSource.query(
      `UPDATE tailor_profiles t SET rank_score = v.score
       FROM unnest($1::uuid[], $2::float[]) AS v(id, score) WHERE t.id = v.id`,
      [tailors.map((tailor) => tailor.id), scores],
    );
    this.logger.log(
      `Ranked ${tailors.length} tailors (global mean rating ${globalMean.toFixed(2)})`,
    );
    return tailors.length;
  }
}
