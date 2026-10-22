import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLM_CLIENT, type LlmClient } from '../../../integrations/llm/llm.types.js';
import {
  COLOURS,
  Gender,
  Occasion,
  ProductCategory,
  WearStyle,
  type Colour,
} from '../catalogue.enums.js';
import { Product } from '../entities/product.entity.js';

/** Small batches keep each request inside Groq's per-minute token limit. */
const BATCH_SIZE = 10;

const SYSTEM_PROMPT = `You classify products from Pakistani clothing brands.
For every product return its best tags using ONLY these values:
- category: ${Object.values(ProductCategory).join(', ')}
  (an eastern "shirt" or kameez is "kurta"; ready-made 2/3-piece outfits are "suit"; fabric sold unstitched is "unstitched")
- gender: ${Object.values(Gender).join(', ')}
- style: ${Object.values(WearStyle).join(', ')}
- colours: 1 to 3 of ${COLOURS.join(', ')}
- occasions: 1 to 3 of ${Object.values(Occasion).join(', ')}
- fabric: one lowercase word such as lawn, cotton, chiffon, khaddar, silk, denim, or null
Answer with JSON only: {"products":[{"id":"...","category":"...","gender":"...","style":"...","colours":[],"occasions":[],"fabric":null}]}`;

interface AiTags {
  id: string;
  category?: unknown;
  gender?: unknown;
  style?: unknown;
  colours?: unknown;
  occasions?: unknown;
  fabric?: unknown;
}

const oneOf = <T extends string>(allowed: readonly T[], value: unknown): T | undefined =>
  typeof value === 'string' && allowed.includes(value as T) ? (value as T) : undefined;

const someOf = <T extends string>(allowed: readonly T[], value: unknown, max: number): T[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((v): v is T => oneOf(allowed, v) !== undefined))].slice(0, max)
    : [];

/**
 * Refines the rule-based tags with the LLM. Runs after each sync on a limited number of
 * products, so the whole catalogue is improved gradually within the free API limits.
 * Every value the model returns is checked against our enums before it is saved.
 */
@Injectable()
export class AiTaggerService {
  private readonly logger = new Logger(AiTaggerService.name);

  constructor(
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  /** Tags up to `limit` products that the AI has not seen yet. Returns how many were updated. */
  async tagPending(limit: number): Promise<number> {
    const pending = await this.products.find({
      where: { aiTagged: false, isActive: true },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    let tagged = 0;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      try {
        tagged += await this.tagBatch(pending.slice(i, i + BATCH_SIZE));
      } catch (error) {
        if (error instanceof ServiceUnavailableException) {
          this.logger.warn('All AI keys are rate-limited; remaining products are tagged next run');
          break;
        }
        this.logger.error(`AI tagging batch failed: ${(error as Error).message}`);
      }
    }
    return tagged;
  }

  /**
   * Groq's strict JSON mode sometimes rejects the model's output (HTTP 400). In that case we
   * ask again without it and cut the JSON object out of the plain answer ourselves.
   */
  private async askForTags(input: unknown): Promise<{ products?: AiTags[] }> {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: JSON.stringify(input) },
    ];
    let content: string | null;
    try {
      ({ content } = await this.llm.chat({
        tier: 'fast',
        json: true,
        temperature: 0,
        maxTokens: 3_000,
        messages,
      }));
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('400')) throw error;
      ({ content } = await this.llm.chat({
        tier: 'fast',
        temperature: 0,
        maxTokens: 3_000,
        messages,
      }));
    }
    const text = content ?? '';
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return json ? (JSON.parse(json) as { products?: AiTags[] }) : {};
  }

  private async tagBatch(batch: Product[]): Promise<number> {
    const input = batch.map((product) => ({
      id: product.id,
      title: product.title,
      brandLabel: product.brandCategory,
      ruleCategory: product.category,
      ruleColours: product.colours,
      description: product.description?.slice(0, 160) ?? '',
    }));

    const parsed = await this.askForTags(input);
    const byId = new Map(batch.map((product) => [product.id, product]));
    let updated = 0;

    for (const tags of parsed.products ?? []) {
      const product = byId.get(tags.id);
      if (!product) continue;

      const colours = someOf<Colour>(COLOURS, tags.colours, 3);
      const occasions = someOf(Object.values(Occasion), tags.occasions, 3);
      await this.products.update(product.id, {
        category: oneOf(Object.values(ProductCategory), tags.category) ?? product.category,
        gender: oneOf(Object.values(Gender), tags.gender) ?? product.gender,
        style: oneOf(Object.values(WearStyle), tags.style) ?? product.style,
        colours: colours.length > 0 ? colours : product.colours,
        occasions: occasions.length > 0 ? occasions : product.occasions,
        fabric:
          typeof tags.fabric === 'string' && /^[a-z ]{3,30}$/.test(tags.fabric)
            ? tags.fabric
            : product.fabric,
        aiTagged: true,
      });
      updated++;
    }
    return updated;
  }
}
