/**
 * Review sentiment job. Runs the pre-trained multilingual model
 * nlptown/bert-base-multilingual-uncased-sentiment (ONNX build, on CPU, free) over reviews that
 * have no score yet, saves the scores, then re-ranks every tailor.
 *
 * It runs outside the web server (GitHub Actions on a schedule, or `npm run job:reviews`), so the
 * ~170 MB model never uses the free server's memory. Transformers.js is a devDependency because
 * only this job needs it.
 */
import { pipeline, type TextClassificationOutput } from '@huggingface/transformers';
import dataSource from '../database/data-source.js';
import { TailorRankingService } from '../modules/tailors/ranking/tailor-ranking.service.js';
import { sentimentFromStars, sentimentLabel } from '../modules/tailors/ranking/tailor-ranking.js';

const MODEL = 'Xenova/bert-base-multilingual-uncased-sentiment';
const MAX_REVIEWS_PER_RUN = 1_000;

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    const reviews: { id: string; comment: string }[] = await dataSource.query(
      `SELECT id, comment FROM reviews
       WHERE sentiment_score IS NULL AND comment IS NOT NULL AND length(trim(comment)) >= 3
       ORDER BY created_at LIMIT $1`,
      [MAX_REVIEWS_PER_RUN],
    );
    console.log(`${reviews.length} reviews to score`);

    if (reviews.length > 0) {
      const classify = await pipeline('text-classification', MODEL, { dtype: 'q8' });
      const scores: number[] = [];
      for (const review of reviews) {
        // top_k 5 = a probability for each of "1 star" ... "5 stars".
        const output = (await classify(review.comment.slice(0, 1000), {
          top_k: 5,
        })) as TextClassificationOutput;
        scores.push(
          sentimentFromStars(
            output.map((item) => ({ stars: parseInt(item.label, 10), score: item.score })),
          ),
        );
      }
      await dataSource.query(
        `UPDATE reviews r SET sentiment_score = v.score, sentiment_label = v.label
         FROM unnest($1::uuid[], $2::float[], $3::text[]) AS v(id, score, label) WHERE r.id = v.id`,
        [reviews.map((review) => review.id), scores, scores.map(sentimentLabel)],
      );
      console.log(`Scored ${reviews.length} reviews`);
    }

    const ranked = await new TailorRankingService(dataSource).recomputeAll();
    console.log(`Re-ranked ${ranked} tailors`);
  } finally {
    await dataSource.destroy();
  }
}

await main();
