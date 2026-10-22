import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LLM_CLIENT,
  type ChatMessage,
  type LlmClient,
  type ToolDefinition,
} from '../../../integrations/llm/llm.types.js';
import { COLOURS, ProductCategory } from '../../catalogue/catalogue.enums.js';
import { ProductsService, type StockedProduct } from '../../catalogue/products.service.js';
import { slotOf, validateOutfit } from './outfit-rules.js';
import {
  customerSizes,
  pickVariant,
  type BuiltOutfit,
  type StylistContext,
} from './stylist.types.js';

const MAX_TURNS = 8;
const MAX_SEARCHES = 8;
const MAX_FIX_ATTEMPTS = 1;

const WEARABLE = Object.values(ProductCategory).filter((category) => slotOf(category) !== null);

const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description:
        "Search in-stock products in the customer's gender and style, best occasion/colour matches first. Call it once per kind of piece you need.",
      parameters: {
        type: 'object',
        properties: {
          // No "enum" here on purpose: Groq rejects the whole call if the model sends one value
          // outside an enum. Allowed values are listed in the description and unknown ones are
          // dropped by search() below.
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: `Kinds of piece, from: ${WEARABLE.join(', ')}`,
          },
          colours: {
            type: 'array',
            items: { type: 'string' },
            description: `From: ${COLOURS.join(', ')}`,
          },
          maxPrice: { type: 'integer', description: 'Maximum price of one piece in rupees' },
          query: {
            type: 'string',
            description: 'Optional keyword, e.g. chiffon, embroidered, khussa',
          },
          limit: { type: 'integer', description: '1 to 8' },
        },
        required: ['categories', 'maxPrice'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'submitOutfits',
      description: 'Submit the final 2 or 3 complete outfits. Call exactly once when you are done.',
      parameters: {
        type: 'object',
        properties: {
          outfits: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Up to 6 words, e.g. "Soft pastel mehndi look"',
                },
                reason: {
                  type: 'string',
                  description: 'One sentence on why it suits the occasion',
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string' },
                      reason: {
                        type: 'string',
                        description: 'Up to 15 words, based only on the product data',
                      },
                    },
                    required: ['productId', 'reason'],
                  },
                },
              },
              required: ['title', 'reason', 'items'],
            },
          },
        },
        required: ['outfits'],
      },
    },
  },
];

function systemPrompt(context: StylistContext): string {
  return `You are Kapra's personal stylist for Pakistani fashion. Build 2 or 3 complete, different outfits.
Rules:
- Use searchProducts to find real pieces. Only use productIds that searchProducts returned.
- A complete outfit is EITHER one full look (category suit, dress or unstitched) with optional dupatta/shawl, shoes and up to 2 accessories, OR a top (kurta/top) plus a bottom (trousers) with optional dupatta, outerwear, shoes and accessories.
- Never combine a full look with separate trousers or a separate top. Never repeat a kind of piece.
- Each outfit's total price must be at most Rs ${context.budget}. Prefer using most of the budget on the main piece.
- Make the outfits different from each other (different brands, colours or silhouettes).
- Write reasons only from the colours, fabric and occasions in the product data. Do not invent details.
- Finish by calling submitOutfits exactly once.${context.anchor ? `\n- Every outfit MUST include product ${context.anchor.id} ("${context.anchor.title}") and be built around it.` : ''}`;
}

function requestSummary(context: StylistContext): string {
  return JSON.stringify({
    occasion: context.occasion,
    budget: context.budget,
    gender: context.gender,
    styles: context.styles,
    preferredColours: context.colours,
    avoidColours: context.avoidColours,
    notes: context.notes ?? null,
    mustInclude: context.anchor ? compact(context.anchor) : null,
  });
}

/** What the model sees about a product: only facts from our database. */
function compact(product: StockedProduct) {
  return {
    id: product.id,
    title: product.title.slice(0, 70),
    brand: product.brand.name,
    category: product.category,
    colours: product.colours,
    occasions: product.occasions,
    fabric: product.fabric,
    price: product.price,
    sizes: product.stock.map((variant) => variant.size).slice(0, 8),
  };
}

interface SubmittedOutfit {
  title?: unknown;
  reason?: unknown;
  items?: { productId?: unknown; reason?: unknown }[];
}

const text = (value: unknown, max: number, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;

/**
 * The AI stylist: a tool-calling loop with Groq.
 *   model -> "searchProducts(...)" -> we query PostgreSQL and send back real products ->
 *   ... -> model -> "submitOutfits(...)" -> we validate every id, price, stock and rule.
 * The model can only choose from products our tools returned, so it cannot invent items.
 * Invalid outfits go back to the model once with the exact problems listed.
 */
@Injectable()
export class StylistAgentService {
  private readonly logger = new Logger(StylistAgentService.name);

  constructor(
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
    private readonly productsService: ProductsService,
  ) {}

  async run(context: StylistContext): Promise<BuiltOutfit[]> {
    const seen = new Map<string, StockedProduct>();
    if (context.anchor) seen.set(context.anchor.id, context.anchor);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt(context) },
      { role: 'user', content: requestSummary(context) },
    ];
    let searches = 0;
    let fixAttempts = 0;
    let bestSoFar: BuiltOutfit[] = [];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const reply = await this.llm.chat({
        tier: 'smart',
        messages,
        tools: TOOLS,
        temperature: 0.5,
        maxTokens: 3_000,
      });
      messages.push({
        role: 'assistant',
        content: reply.content ?? '',
        tool_calls: reply.tool_calls,
      });

      if (!reply.tool_calls?.length) {
        messages.push({ role: 'user', content: 'Call submitOutfits now with your final outfits.' });
        continue;
      }

      for (const call of reply.tool_calls) {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
        } catch {
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: '{"error":"Arguments were not valid JSON."}',
          });
          continue;
        }

        if (call.function.name === 'searchProducts') {
          if (++searches > MAX_SEARCHES) {
            messages.push({
              role: 'tool',
              tool_call_id: call.id,
              content: '{"error":"Search limit reached. Submit your outfits now."}',
            });
            continue;
          }
          const results = await this.search(context, args);
          results.forEach((product) => seen.set(product.id, product));
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(results.map(compact)),
          });
          continue;
        }

        if (call.function.name === 'submitOutfits') {
          const { outfits, problems } = this.check(
            context,
            args.outfits as SubmittedOutfit[] | undefined,
            seen,
          );
          if (outfits.length > bestSoFar.length) bestSoFar = outfits;
          if (problems.length === 0 && outfits.length >= 2) return outfits;
          if (fixAttempts >= MAX_FIX_ATTEMPTS) {
            if (bestSoFar.length) return bestSoFar;
            throw new Error(`Stylist outfits failed validation: ${problems.join(' | ')}`);
          }
          fixAttempts++;
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify({
              accepted: outfits.length,
              problems,
              instruction:
                'Fix these problems and call submitOutfits again with 2-3 valid outfits.',
            }),
          });
          continue;
        }

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: '{"error":"Unknown tool."}',
        });
      }
    }

    if (bestSoFar.length) return bestSoFar;
    throw new Error('Stylist did not submit outfits in time');
  }

  /** Runs the model's search request against the catalogue, inside the customer's limits. */
  private search(
    context: StylistContext,
    args: Record<string, unknown>,
  ): Promise<StockedProduct[]> {
    const categories = Array.isArray(args.categories)
      ? (args.categories.filter((c) =>
          WEARABLE.includes(c as ProductCategory),
        ) as ProductCategory[])
      : [];
    const colours = Array.isArray(args.colours)
      ? args.colours.filter((c): c is string =>
          (COLOURS as readonly string[]).includes(c as string),
        )
      : context.colours;
    const maxPrice = Math.min(Number(args.maxPrice) || context.budget, context.budget);
    const limit = Math.min(Math.max(Number(args.limit) || 6, 1), 8);

    return this.productsService.searchForStylist({
      gender: context.gender,
      styles: context.styles,
      categories: categories.length ? categories : undefined,
      colours,
      avoidColours: context.avoidColours,
      occasion: context.occasion,
      maxPrice,
      query: typeof args.query === 'string' ? args.query.slice(0, 40) : undefined,
      excludeIds: context.excludeIds,
      sizes: customerSizes(context.sizes),
      limit,
    });
  }

  /** Turns submitted outfits into built ones, collecting every problem found. */
  private check(
    context: StylistContext,
    submitted: SubmittedOutfit[] | undefined,
    seen: Map<string, StockedProduct>,
  ): { outfits: BuiltOutfit[]; problems: string[] } {
    const outfits: BuiltOutfit[] = [];
    const problems: string[] = [];
    if (!Array.isArray(submitted) || submitted.length === 0) {
      return { outfits, problems: ['No outfits were submitted.'] };
    }

    submitted.slice(0, 3).forEach((outfit, index) => {
      const label = `Outfit ${index + 1}`;
      const ids = (outfit.items ?? []).map((item) => String(item.productId ?? ''));
      const unknown = ids.filter((id) => !seen.has(id));
      if (unknown.length) {
        problems.push(
          `${label}: these productIds were not returned by searchProducts: ${unknown.join(', ')}.`,
        );
        return;
      }
      if (context.anchor && !ids.includes(context.anchor.id)) {
        problems.push(`${label}: must include product ${context.anchor.id}.`);
        return;
      }
      const products = ids.map((id) => seen.get(id)!);
      const ruleProblems = validateOutfit(
        products.map((product) => ({
          productId: product.id,
          category: product.category,
          price: product.price,
        })),
        context.budget,
      );
      if (ruleProblems.length) {
        problems.push(...ruleProblems.map((problem) => `${label}: ${problem}`));
        return;
      }
      outfits.push({
        title: text(outfit.title, 80, `Look ${index + 1}`),
        reason: text(outfit.reason, 400, 'Put together for your occasion and budget.'),
        total: products.reduce((sum, product) => sum + product.price, 0),
        items: products.map((product, position) => {
          const slot = slotOf(product.category)!;
          return {
            product,
            slot,
            variantId: pickVariant(product, slot, context.sizes),
            reason: text(outfit.items?.[position]?.reason, 200, ''),
          };
        }),
      });
    });

    if (problems.length) this.logger.debug(`Stylist validation problems: ${problems.join(' | ')}`);
    return { outfits, problems };
  }
}
