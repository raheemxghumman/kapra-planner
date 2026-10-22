/** What a tailor is known for; customers filter by these on the map. */
export enum TailorSpeciality {
  WomenEastern = 'women_eastern',
  MenEastern = 'men_eastern',
  Bridal = 'bridal',
  Western = 'western',
  Kids = 'kids',
  Alterations = 'alterations',
}

/** The kind of work one priced service is. */
export enum ServiceType {
  Stitching = 'stitching',
  Alteration = 'alteration',
  Embroidery = 'embroidery',
  Bridal = 'bridal',
}

export const TAILOR_SORTS = ['best', 'nearest', 'rating', 'price'] as const;
export type TailorSort = (typeof TAILOR_SORTS)[number];
