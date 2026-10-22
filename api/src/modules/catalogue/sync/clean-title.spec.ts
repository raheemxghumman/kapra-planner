import { cleanTitle } from './clean-title.js';

describe('cleanTitle', () => {
  it('drops shop prefixes and article codes', () => {
    expect(cleanTitle('RTW | Embroidered Lawn Shirt (W25DE2038)')).toBe('Embroidered Lawn Shirt');
  });

  it('turns all-caps titles into normal case, keeping small words lowercase', () => {
    expect(cleanTitle('CAPE SWEATER WITH POCKETS')).toBe('Cape Sweater with Pockets');
  });

  it('leaves normal titles alone', () => {
    expect(cleanTitle('3 Piece Printed Lawn Suit')).toBe('3 Piece Printed Lawn Suit');
  });

  it('keeps short codes such as PC in capitals', () => {
    expect(cleanTitle('VELOUR NOIR 2 PC')).toBe('Velour Noir 2 PC');
  });
});
