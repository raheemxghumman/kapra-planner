import { ProductCategory } from '../../catalogue/catalogue.enums.js';
import { validateOutfit, type RuleItem } from './outfit-rules.js';

const item = (productId: string, category: ProductCategory, price = 2000): RuleItem => ({
  productId,
  category,
  price,
});

describe('validateOutfit', () => {
  it('accepts a ready-made suit on its own', () => {
    expect(validateOutfit([item('a', ProductCategory.Suit)], 5000)).toEqual([]);
  });

  it('accepts a kurta with trousers, dupatta and shoes', () => {
    const outfit = [
      item('a', ProductCategory.Kurta),
      item('b', ProductCategory.Trousers),
      item('c', ProductCategory.Dupatta),
      item('d', ProductCategory.Shoes),
    ];
    expect(validateOutfit(outfit, 10_000)).toEqual([]);
  });

  it('rejects a top without a bottom', () => {
    expect(
      validateOutfit(
        [item('a', ProductCategory.Kurta), item('b', ProductCategory.Shoes)],
        10_000,
      )[0],
    ).toMatch(/incomplete/i);
  });

  it('rejects a full look combined with separate trousers', () => {
    const problems = validateOutfit(
      [item('a', ProductCategory.Suit), item('b', ProductCategory.Trousers)],
      10_000,
    );
    expect(problems.join(' ')).toMatch(/full look already includes/i);
  });

  it('rejects two pairs of shoes and duplicate products', () => {
    const problems = validateOutfit(
      [
        item('a', ProductCategory.Dress),
        item('b', ProductCategory.Shoes),
        item('c', ProductCategory.Shoes),
        item('a', ProductCategory.Dress),
      ],
      50_000,
    );
    expect(problems.join(' ')).toMatch(/shoes/);
    expect(problems.join(' ')).toMatch(/appears twice/);
  });

  it('rejects outfits over budget, saying by how much', () => {
    const problems = validateOutfit(
      [item('a', ProductCategory.Suit, 9000), item('b', ProductCategory.Shoes, 3000)],
      10_000,
    );
    expect(problems).toEqual([
      'Total Rs 12000 is over the budget of Rs 10000; choose cheaper pieces.',
    ]);
  });
});
