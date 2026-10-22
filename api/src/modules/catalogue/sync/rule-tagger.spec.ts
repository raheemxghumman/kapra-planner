import type { FeedProduct } from '../../../integrations/brand-feeds/shopify-feed.client.js';
import { Gender, Occasion, ProductCategory, WearStyle } from '../catalogue.enums.js';
import { detectColours, shouldImport, tagByRules } from './rule-tagger.js';

const product = (overrides: Partial<FeedProduct>): FeedProduct => ({
  id: 1,
  title: 'Item',
  handle: 'item',
  body_html: null,
  product_type: '',
  tags: [],
  options: [],
  variants: [],
  images: [{ src: 'https://cdn.example.com/a.jpg' }],
  ...overrides,
});

const WOMEN_EASTERN = { gender: Gender.Women, style: WearStyle.Eastern };
const UNISEX_WESTERN = { gender: Gender.Unisex, style: WearStyle.Western };

describe('rule tagger', () => {
  it('treats an eastern "shirt" as a kurta', () => {
    const tags = tagByRules(product({ title: 'Printed Lawn Shirt', product_type: 'Pret' }), WOMEN_EASTERN);
    expect(tags.category).toBe(ProductCategory.Kurta);
    expect(tags.style).toBe(WearStyle.Eastern);
    expect(tags.fabric).toBe('lawn');
  });

  it('keeps a western t-shirt as a top for men', () => {
    const tags = tagByRules(product({ title: 'Graphic T-Shirt', tags: ['Men', 'Tops'] }), UNISEX_WESTERN);
    expect(tags).toMatchObject({ category: ProductCategory.Top, gender: Gender.Men, style: WearStyle.Western });
  });

  it('does not read "women" as "men"', () => {
    expect(tagByRules(product({ title: 'Jeans', tags: 'Women' }), UNISEX_WESTERN).gender).toBe(Gender.Women);
  });

  it('recognises unstitched suits, shoes and dupattas', () => {
    expect(tagByRules(product({ product_type: 'Unstitched Printed', title: '3 Piece Lawn Suit' }), WOMEN_EASTERN).category).toBe(
      ProductCategory.Unstitched,
    );
    expect(tagByRules(product({ title: 'Golden Khussa' }), WOMEN_EASTERN).category).toBe(ProductCategory.Shoes);
    expect(tagByRules(product({ title: 'Chiffon Dupatta' }), WOMEN_EASTERN).category).toBe(ProductCategory.Dupatta);
  });

  it('treats a shirt sold with a dupatta as a suit', () => {
    expect(tagByRules(product({ title: 'Printed Lawn Shirt & Dupatta' }), WOMEN_EASTERN).category).toBe(
      ProductCategory.Suit,
    );
    expect(tagByRules(product({ title: '2 Piece Embroidered Dupatta Set' }), WOMEN_EASTERN).category).toBe(
      ProductCategory.Suit,
    );
    expect(tagByRules(product({ title: 'Chiffon Dupatta' }), WOMEN_EASTERN).category).toBe(ProductCategory.Dupatta);
  });

  it('reads the title before tags that list several sections', () => {
    const shirt = product({ title: 'Embroidered Lawn Shirt', tags: ['Shirts', 'Trousers', '2 Piece'] });
    expect(tagByRules(shirt, WOMEN_EASTERN).category).toBe(ProductCategory.Kurta);
  });

  it('finds occasions from fabric and keywords, defaulting to casual', () => {
    expect(tagByRules(product({ title: 'Embroidered Chiffon Bridal Lehenga' }), WOMEN_EASTERN).occasions).toEqual(
      expect.arrayContaining([Occasion.Wedding, Occasion.Formal]),
    );
    expect(tagByRules(product({ title: 'Kurta' }), WOMEN_EASTERN).occasions).toEqual([Occasion.Casual]);
  });

  it('maps shop colour names to our palette, preferring the longest match', () => {
    const colours = detectColours(
      product({ title: 'Navy Blue Kurta', options: [{ name: 'Color', values: ['Off White', 'Tea Pink'] }] }),
    );
    expect(colours).toEqual(expect.arrayContaining(['navy', 'ivory', 'pink']));
    expect(colours).not.toContain('blue');
  });

  it('skips kids wear, home goods and products without images', () => {
    expect(shouldImport(product({ title: 'Girls Frock' }))).toBe(false);
    expect(shouldImport(product({ title: 'Scented Candle', product_type: 'Home' }))).toBe(false);
    expect(shouldImport(product({ title: 'Kurta', images: [] }))).toBe(false);
    expect(shouldImport(product({ title: 'Kurta' }))).toBe(true);
  });
});
