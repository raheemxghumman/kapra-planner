import { Gender, Occasion, OutfitSlot, WearStyle } from '../../catalogue/catalogue.enums.js';
import type { StockedProduct } from '../../catalogue/products.service.js';
import type { SizeMap } from '../../profiles/entities/style-profile.entity.js';

/** Everything the stylist needs to know about one request. */
export interface StylistContext {
  occasion: Occasion;
  budget: number;
  gender: Gender;
  styles: WearStyle[];
  colours: string[];
  avoidColours: string[];
  notes?: string;
  sizes: SizeMap;
  /** Products the customer disliked before. */
  excludeIds: string[];
  /** "Build a look around this piece" from the product page. */
  anchor?: StockedProduct;
}

export interface BuiltItem {
  product: StockedProduct;
  slot: OutfitSlot;
  variantId: string | null;
  reason: string;
}

export interface BuiltOutfit {
  title: string;
  reason: string;
  items: BuiltItem[];
  total: number;
}

const SIZE_FOR_SLOT: Partial<Record<OutfitSlot, keyof SizeMap>> = {
  [OutfitSlot.Top]: 'top',
  [OutfitSlot.FullLook]: 'top',
  [OutfitSlot.Outer]: 'top',
  [OutfitSlot.Bottom]: 'bottom',
  [OutfitSlot.Shoes]: 'shoes',
};

/** The customer's usual size if in stock, else a free size, else the first size in stock. */
export function pickVariant(
  product: StockedProduct,
  slot: OutfitSlot,
  sizes: SizeMap,
): string | null {
  const wanted = SIZE_FOR_SLOT[slot] ? sizes[SIZE_FOR_SLOT[slot]!]?.toLowerCase() : undefined;
  const match =
    (wanted && product.stock.find((variant) => variant.size.toLowerCase() === wanted)) ||
    product.stock.find((variant) => /free|one size|default/i.test(variant.size)) ||
    product.stock[0];
  return match?.variantId ?? null;
}

/** The customer's sizes in lower case, for matching against variant sizes. */
export const customerSizes = (sizes: SizeMap): string[] =>
  [sizes.top, sizes.bottom, sizes.shoes]
    .filter((size): size is string => Boolean(size))
    .map((size) => size.toLowerCase());
