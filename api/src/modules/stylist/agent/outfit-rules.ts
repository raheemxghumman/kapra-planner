import { OutfitSlot, ProductCategory, SLOT_FOR_CATEGORY } from '../../catalogue/catalogue.enums.js';

export interface RuleItem {
  productId: string;
  category: ProductCategory;
  price: number;
}

export const MAX_ITEMS_PER_OUTFIT = 6;

export function slotOf(category: ProductCategory): OutfitSlot | null {
  return SLOT_FOR_CATEGORY[category];
}

/**
 * Checks that a set of pieces is a wearable, affordable look. Returns the problems found
 * (empty array = valid), worded so they can be sent back to the AI to fix.
 *
 * A look is complete when it has either a full look (dress, ready-made suit, unstitched suit)
 * or both a top and a bottom. A full look cannot be combined with a separate top or bottom,
 * and no slot may appear twice (except up to two accessories).
 */
export function validateOutfit(items: RuleItem[], budget: number): string[] {
  const problems: string[] = [];
  if (items.length === 0) return ['The outfit has no pieces.'];
  if (items.length > MAX_ITEMS_PER_OUTFIT)
    problems.push(`Use at most ${MAX_ITEMS_PER_OUTFIT} pieces.`);

  const slots = items.map((item) => slotOf(item.category));
  if (slots.some((slot) => slot === null)) problems.push('One piece is not wearable clothing.');

  const count = (slot: OutfitSlot) => slots.filter((s) => s === slot).length;
  const hasFullLook = count(OutfitSlot.FullLook) > 0;
  const hasTop = count(OutfitSlot.Top) > 0;
  const hasBottom = count(OutfitSlot.Bottom) > 0;

  if (!hasFullLook && !(hasTop && hasBottom)) {
    problems.push(
      'Incomplete: include a full look (suit, dress or unstitched suit) or both a top and a bottom.',
    );
  }
  if (hasFullLook && (hasTop || hasBottom)) {
    problems.push(
      'A full look already includes the top and bottom; remove the separate top or bottom.',
    );
  }
  for (const slot of Object.values(OutfitSlot)) {
    const limit = slot === OutfitSlot.Accessory ? 2 : 1;
    if (count(slot) > limit)
      problems.push(`Only ${limit} ${slot.replace('_', ' ')} piece(s) allowed.`);
  }
  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    problems.push('The same product appears twice.');
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  if (total > budget) {
    problems.push(`Total Rs ${total} is over the budget of Rs ${budget}; choose cheaper pieces.`);
  }
  return problems;
}

export const outfitTotal = (items: RuleItem[]) => items.reduce((sum, item) => sum + item.price, 0);
