import { Injectable } from '@nestjs/common';
import { OutfitSlot, ProductCategory, WearStyle } from '../../catalogue/catalogue.enums.js';
import { ProductsService, type StockedProduct } from '../../catalogue/products.service.js';
import { slotOf, validateOutfit } from './outfit-rules.js';
import {
  customerSizes,
  pickVariant,
  type BuiltOutfit,
  type StylistContext,
} from './stylist.types.js';

const FULL_LOOKS = [ProductCategory.Suit, ProductCategory.Dress];
const TOPS = [ProductCategory.Kurta, ProductCategory.Top];

const label = (value: string) => value.replace(/_/g, ' ');

/**
 * Rule-based stylist used when the AI is unavailable (rate-limited, down or invalid answers).
 * It follows the same rules and validation as the AI, so the customer always gets real,
 * complete, in-budget looks, just with simpler reasoning.
 */
@Injectable()
export class RuleStylistService {
  constructor(private readonly productsService: ProductsService) {}

  async run(context: StylistContext): Promise<BuiltOutfit[]> {
    const used = new Set<string>(context.excludeIds);
    const outfits: BuiltOutfit[] = [];

    for (const plan of ['fullLook', 'separates', 'fullLook'] as const) {
      if (outfits.length >= 3) break;
      const outfit =
        plan === 'fullLook'
          ? await this.fullLook(context, used)
          : await this.separates(context, used);
      if (outfit) {
        outfits.push(outfit);
        outfit.items.forEach((item) => used.add(item.product.id));
      }
    }
    return outfits;
  }

  private find(
    context: StylistContext,
    categories: ProductCategory[],
    maxPrice: number,
    used: Set<string>,
  ) {
    return this.productsService.searchForStylist({
      gender: context.gender,
      styles: context.styles,
      categories,
      colours: context.colours,
      avoidColours: context.avoidColours,
      occasion: context.occasion,
      maxPrice,
      excludeIds: [...used],
      sizes: customerSizes(context.sizes),
      limit: 6,
    });
  }

  /** The anchor (if any) or the best matching main piece within most of the budget. */
  private async mainPiece(
    context: StylistContext,
    categories: ProductCategory[],
    share: number,
    used: Set<string>,
  ) {
    if (context.anchor && categories.includes(context.anchor.category)) return context.anchor;
    const [best] = await this.find(context, categories, Math.round(context.budget * share), used);
    return best;
  }

  private async fullLook(context: StylistContext, used: Set<string>): Promise<BuiltOutfit | null> {
    const main = await this.mainPiece(context, FULL_LOOKS, 0.8, used);
    if (!main) return null;
    const pieces: StockedProduct[] = [main];
    let left = context.budget - main.price;

    const [shoes] = await this.find(context, [ProductCategory.Shoes], left, used);
    if (shoes) {
      pieces.push(shoes);
      left -= shoes.price;
    }
    if (context.styles.includes(WearStyle.Eastern) && left > 1500) {
      const [dupatta] = await this.find(
        context,
        [ProductCategory.Dupatta, ProductCategory.Shawl],
        left,
        used,
      );
      if (dupatta) pieces.push(dupatta);
    }
    return this.build(context, pieces, `${main.brand.name} ${label(main.category)} look`);
  }

  private async separates(context: StylistContext, used: Set<string>): Promise<BuiltOutfit | null> {
    const top = await this.mainPiece(context, TOPS, 0.6, used);
    if (!top) return null;
    let left = context.budget - top.price;
    const [bottom] = await this.find(context, [ProductCategory.Trousers], left, used);
    if (!bottom) return null;
    left -= bottom.price;
    const pieces = [top, bottom];
    const [shoes] = await this.find(context, [ProductCategory.Shoes], left, used);
    if (shoes) pieces.push(shoes);
    return this.build(context, pieces, `${label(top.category)} and trousers`);
  }

  private build(
    context: StylistContext,
    pieces: StockedProduct[],
    title: string,
  ): BuiltOutfit | null {
    const problems = validateOutfit(
      pieces.map((product) => ({
        productId: product.id,
        category: product.category,
        price: product.price,
      })),
      context.budget,
    );
    if (problems.length) return null;

    const colours = [...new Set(pieces.flatMap((product) => product.colours))].slice(0, 3);
    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      reason: `Chosen for ${label(context.occasion)} within Rs ${context.budget.toLocaleString('en-PK')}${colours.length ? `, in ${colours.join(', ')}` : ''}.`,
      total: pieces.reduce((sum, product) => sum + product.price, 0),
      items: pieces.map((product) => {
        const slot = slotOf(product.category) ?? OutfitSlot.Accessory;
        return {
          product,
          slot,
          variantId: pickVariant(product, slot, context.sizes),
          reason: [product.fabric, ...product.colours.slice(0, 2)].filter(Boolean).join(', '),
        };
      }),
    };
  }
}
