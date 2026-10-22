/**
 * The shared vocabulary of the catalogue. Every brand labels products differently
 * ("RTW", "Eastern Top", "Unstitched Printed"), so the sync maps them onto these values.
 */

export enum ProductCategory {
  Kurta = 'kurta',
  Top = 'top',
  Trousers = 'trousers',
  Dupatta = 'dupatta',
  Shawl = 'shawl',
  Dress = 'dress',
  Suit = 'suit',
  Unstitched = 'unstitched',
  Outerwear = 'outerwear',
  Shoes = 'shoes',
  Bag = 'bag',
  Jewellery = 'jewellery',
  Accessory = 'accessory',
  Other = 'other',
}

export enum Gender {
  Women = 'women',
  Men = 'men',
  Unisex = 'unisex',
}

export enum WearStyle {
  Eastern = 'eastern',
  Western = 'western',
}

export enum Occasion {
  Casual = 'casual',
  Office = 'office',
  Festive = 'festive',
  Formal = 'formal',
  Wedding = 'wedding',
  Party = 'party',
}

export enum BrandTier {
  HighStreet = 'high_street',
  Designer = 'designer',
}

/** Colours products are tagged with; search and the stylist use these names. */
export const COLOURS = [
  'black',
  'white',
  'ivory',
  'beige',
  'brown',
  'grey',
  'red',
  'maroon',
  'pink',
  'peach',
  'orange',
  'yellow',
  'mustard',
  'green',
  'olive',
  'mint',
  'teal',
  'blue',
  'navy',
  'sky blue',
  'purple',
  'lilac',
  'gold',
  'silver',
  'multi',
] as const;
export type Colour = (typeof COLOURS)[number];

/** Where a piece goes in an outfit. A dress or a ready-made suit fills several slots at once. */
export enum OutfitSlot {
  Top = 'top',
  Bottom = 'bottom',
  Dupatta = 'dupatta',
  Outer = 'outer',
  FullLook = 'full_look',
  Shoes = 'shoes',
  Accessory = 'accessory',
}

export const SLOT_FOR_CATEGORY: Record<ProductCategory, OutfitSlot | null> = {
  [ProductCategory.Kurta]: OutfitSlot.Top,
  [ProductCategory.Top]: OutfitSlot.Top,
  [ProductCategory.Trousers]: OutfitSlot.Bottom,
  [ProductCategory.Dupatta]: OutfitSlot.Dupatta,
  [ProductCategory.Shawl]: OutfitSlot.Dupatta,
  [ProductCategory.Dress]: OutfitSlot.FullLook,
  [ProductCategory.Suit]: OutfitSlot.FullLook,
  [ProductCategory.Unstitched]: OutfitSlot.FullLook,
  [ProductCategory.Outerwear]: OutfitSlot.Outer,
  [ProductCategory.Shoes]: OutfitSlot.Shoes,
  [ProductCategory.Bag]: OutfitSlot.Accessory,
  [ProductCategory.Jewellery]: OutfitSlot.Accessory,
  [ProductCategory.Accessory]: OutfitSlot.Accessory,
  [ProductCategory.Other]: null,
};
