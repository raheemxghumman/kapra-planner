import type { FeedProduct } from '../../../integrations/brand-feeds/shopify-feed.client.js';
import { Gender, Occasion, ProductCategory, WearStyle, type Colour } from '../catalogue.enums.js';

export interface RuleTags {
  category: ProductCategory;
  gender: Gender;
  style: WearStyle;
  colours: Colour[];
  occasions: Occasion[];
  fabric: string | null;
}

export interface BrandDefaults {
  gender: Gender;
  style: WearStyle;
}

/** Products we never import: children's wear, home goods, beauty, gift cards. */
const EXCLUDE =
  /\b(kids?|boys?|girls?|baby|babies|infants?|toddlers?|junior|teens?|home|bedsheets?|cushions?|towels?|candles?|fragrances?|perfumes?|attar|body mist|makeup|cosmetics?|lipsticks?|nail|gift ?cards?|masks?|vouchers?)\b/;

/** Ordered: the first matching rule wins, so specific words come before general ones. */
const CATEGORY_RULES: [RegExp, ProductCategory][] = [
  [/\bun-?stitched\b/, ProductCategory.Unstitched],
  [/\b(shoes?|khussas?|kolhapuris?|sandals?|heels?|sneakers?|slippers?|loafers?|pumps?|mules?|chappals?|peshawaris?|boots?|footwear|flats?)\b/, ProductCategory.Shoes],
  [/\b(bags?|clutch(es)?|totes?|handbags?|wallets?|purses?|potli)\b/, ProductCategory.Bag],
  [/\b(jewell?ery|earrings?|necklaces?|bangles?|rings?|bracelets?|jhumkas?|pendants?|anklets?)\b/, ProductCategory.Jewellery],
  // Multi-piece sets come before single pieces: "Shirt & Dupatta" is a suit, not a dupatta.
  [
    /\b(2|3|two|three)\s*-?\s*(pc|pcs|piece)\b|\b(suits?|co-?ords?|sets?)\b|\b(shirts?|kurtas?|kameez)\b.*\b(dupattas?|trousers?|shalwars?|pants?)\b/,
    ProductCategory.Suit,
  ],
  [/\b(shawls?|wraps?|pashmina)\b/, ProductCategory.Shawl],
  [/\b(dupattas?|stoles?|scarf|scarves|hijabs?)\b/, ProductCategory.Dupatta],
  [/\b(dress(es)?|gowns?|maxis?|frocks?|jumpsuits?|abayas?|sarees?|saris?|lehengas?|peshwas)\b/, ProductCategory.Dress],
  [/\b(jackets?|coats?|waistcoats?|blazers?|cardigans?|hoodies?|sweatshirts?|sweaters?|shrugs?|puffers?|gilets?)\b/, ProductCategory.Outerwear],
  [/\b(trousers?|pants?|shalwars?|salwars?|palazzos?|culottes?|jeans|denims?|bottoms?|tights|skirts?|cigarette|shararas?|ghararas?|churidars?|chooridars?|shorts|joggers?|leggings?)\b/, ProductCategory.Trousers],
  [/\b(kurtas?|kurtis?|kameez|tunics?|angrakhas?|eastern tops?)\b/, ProductCategory.Kurta],
  [/\b(t-?shirts?|tees?|tops?|blouses?|shirts?|polos?|tanks?|camisoles?|crop)\b/, ProductCategory.Top],
  [/\b(belts?|caps?|hats?|sunglasses|watches|ties?|cufflinks?|socks|hair|brooch(es)?)\b/, ProductCategory.Accessory],
];

const EASTERN_WORDS =
  /\b(lawn|khaddar|karandi|chiffon|kurtas?|kurtis?|kameez|shalwars?|dupattas?|eastern|pret|un-?stitched|jacquard|cambric|chikankari|block print|festive|luxury|bridal|khussas?|peshawaris?|kolhapuris?|sherwanis?|waistcoats?|angrakhas?|lehengas?|shararas?|ghararas?|eid)\b/;
const WESTERN_WORDS =
  /\b(western|jeans|denims?|t-?shirts?|tees?|hoodies?|polos?|skirts?|blazers?|sneakers?|jumpsuits?|joggers?|sweatshirts?|shorts|crop)\b/;

/** Shop colour names -> our palette. Checked longest first, so "navy blue" wins over "blue". */
const COLOUR_SYNONYMS: Record<string, Colour> = {
  'off white': 'ivory', 'off-white': 'ivory', cream: 'ivory', ivory: 'ivory', 'jet black': 'black',
  black: 'black', white: 'white', skin: 'beige', fawn: 'beige', beige: 'beige', khaki: 'beige',
  camel: 'beige', nude: 'beige', tan: 'brown', chocolate: 'brown', brown: 'brown', coffee: 'brown',
  charcoal: 'grey', zinc: 'grey', grey: 'grey', gray: 'grey', ash: 'grey', silver: 'silver',
  wine: 'maroon', burgundy: 'maroon', maroon: 'maroon', plum: 'maroon', red: 'red', crimson: 'red',
  magenta: 'pink', fuchsia: 'pink', 'tea pink': 'pink', blush: 'pink', rose: 'pink', pink: 'pink',
  coral: 'peach', peach: 'peach', rust: 'orange', orange: 'orange', mustard: 'mustard',
  yellow: 'yellow', lemon: 'yellow', golden: 'gold', gold: 'gold', 'sea green': 'green',
  emerald: 'green', 'bottle green': 'green', lime: 'green', green: 'green', olive: 'olive',
  mint: 'mint', pistachio: 'mint', ferozi: 'teal', turquoise: 'teal', aqua: 'teal', teal: 'teal',
  'navy blue': 'navy', navy: 'navy', 'royal blue': 'blue', 'sky blue': 'sky blue',
  'powder blue': 'sky blue', 'ice blue': 'sky blue', blue: 'blue', denim: 'blue', lavender: 'lilac',
  mauve: 'lilac', lilac: 'lilac', purple: 'purple', violet: 'purple', multicolor: 'multi',
  multicolour: 'multi', 'multi color': 'multi', multi: 'multi',
};
const COLOUR_NAMES = Object.keys(COLOUR_SYNONYMS).sort((a, b) => b.length - a.length);

const OCCASION_RULES: [RegExp, Occasion][] = [
  [/\b(bridal|wedding|nikkah|nikah|barat|baraat|walima|mehndi|mayun|lehengas?)\b/, Occasion.Wedding],
  [/\b(luxury|formals?|chiffon|organza|velvet|net|embellished|zari|tissue)\b/, Occasion.Formal],
  [/\b(festive|eid|fancy|celebration)\b/, Occasion.Festive],
  [/\b(party|evening|cocktail)\b/, Occasion.Party],
  [/\b(office|work|workwear|formal shirts?|blazers?)\b/, Occasion.Office],
  [/\b(casual|basic|basics|daily|everyday|lawn|cotton|t-?shirts?|tees?|jeans|denims?|summer|winter|khaddar)\b/, Occasion.Casual],
];

const FABRIC =
  /\b(lawn|cotton|khaddar|karandi|chiffon|silk|organza|velvet|linen|cambric|jacquard|denim|jersey|net|georgette|crepe|marina|viscose|leather|wool|cotton satin|raw silk|dobby|poplin|fleece)\b/;

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

export function productText(product: FeedProduct): string {
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : product.tags;
  return normalise(`${product.product_type} ${product.title} ${tags}`);
}

export function shouldImport(product: FeedProduct): boolean {
  return product.images.length > 0 && !EXCLUDE.test(productText(product));
}

export function detectColours(product: FeedProduct): Colour[] {
  const colourOption = product.options.find((option) => /colou?r/i.test(option.name));
  const sources = [product.title, ...(colourOption?.values ?? [])].map(normalise).join(' | ');
  const found = new Set<Colour>();
  let remaining = sources;
  for (const name of COLOUR_NAMES) {
    const pattern = new RegExp(`\\b${name.replace(/[-/]/g, '[- ]?')}\\b`, 'g');
    if (pattern.test(remaining)) {
      found.add(COLOUR_SYNONYMS[name]);
      remaining = remaining.replace(pattern, ' ');
    }
  }
  return [...found].slice(0, 4);
}

/**
 * Category from the most specific source first: the title, then the brand's product type,
 * then tags. Tags often list every section a product belongs to ("Shirts, Trousers, 2 Piece"),
 * so reading them first would turn single shirts into suits.
 */
export function categoryOf(product: FeedProduct): ProductCategory {
  if (/\bun-?stitched\b/.test(productText(product))) return ProductCategory.Unstitched;
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : product.tags;
  for (const source of [product.title, product.product_type, tags]) {
    const text = normalise(source ?? '');
    const match = CATEGORY_RULES.find(([pattern]) => pattern.test(text));
    if (match) return match[1];
  }
  return ProductCategory.Other;
}

/** Maps a raw feed product onto our taxonomy using keyword rules. Fast, free and deterministic. */
export function tagByRules(product: FeedProduct, defaults: BrandDefaults): RuleTags {
  const text = productText(product);
  const category = categoryOf(product);

  let style = defaults.style;
  if (EASTERN_WORDS.test(text)) style = WearStyle.Eastern;
  else if (WESTERN_WORDS.test(text)) style = WearStyle.Western;

  // In Pakistani shops an eastern "shirt" is the kameez of a suit, i.e. a kurta.
  const finalCategory =
    category === ProductCategory.Top && style === WearStyle.Eastern ? ProductCategory.Kurta : category;

  let gender = defaults.gender;
  if (/\b(women|womens|ladies|woman|female|her)\b/.test(text)) gender = Gender.Women;
  else if (/\b(men|mens|man|gents|male|his|sherwanis?)\b/.test(text)) gender = Gender.Men;
  else if (/\bunisex\b/.test(text)) gender = Gender.Unisex;

  const occasions = [...new Set(OCCASION_RULES.filter(([pattern]) => pattern.test(text)).map(([, o]) => o))];

  return {
    category: finalCategory,
    gender,
    style,
    colours: detectColours(product),
    occasions: occasions.length > 0 ? occasions.slice(0, 3) : [Occasion.Casual],
    fabric: text.match(FABRIC)?.[1] ?? null,
  };
}
