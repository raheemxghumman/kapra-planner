export type ProductCategory =
  | 'kurta'
  | 'top'
  | 'trousers'
  | 'dupatta'
  | 'shawl'
  | 'dress'
  | 'suit'
  | 'unstitched'
  | 'outerwear'
  | 'shoes'
  | 'bag'
  | 'jewellery'
  | 'accessory'
  | 'other';

export type Gender = 'women' | 'men' | 'unisex';
export type WearStyle = 'eastern' | 'western';
export type Occasion = 'casual' | 'office' | 'festive' | 'formal' | 'wedding' | 'party';

export interface BrandRef {
  id: string;
  name: string;
  slug: string;
  tier: 'high_street' | 'designer';
  /** Set when an approved brand account manages it: the brand sells on Kapra. */
  ownerId?: string | null;
  logoUrl?: string | null;
}

export interface ProductVariant {
  id: string;
  size: string;
  inStock: boolean;
  stockQty: number | null;
}

/**
 * Where a garment's shoulders (or waistband) are in its live try-on cut-out, in the cut-out's
 * pixels. Made by the API's cut-out job; see api/src/modules/catalogue/cutouts.
 */
export interface GarmentFit {
  anchor: 'shoulders' | 'hips';
  width: number;
  height: number;
  centerX: number;
  anchorY: number;
  bodyWidth: number;
  /** Where the cut-out lies in its product photo (shares of the photo's width and height). */
  source?: { x: number; y: number; width: number; height: number };
}

export interface LiveTryOn {
  cutoutUrl: string;
  fit: GarmentFit;
  /** The product photo of a model the cut-out came from; null for a flat-lay. */
  modelPhotoUrl: string | null;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  colours: string[];
  category: ProductCategory;
  gender: Gender;
  style: WearStyle;
  occasions: Occasion[];
  fabric: string | null;
  brandId: string;
  brand: BrandRef;
  description?: string | null;
  productUrl?: string | null;
  isActive?: boolean;
  variants?: ProductVariant[];
  /** Product page only: set when the piece can be tried on live with the camera. */
  liveTryOn?: LiveTryOn | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Facets {
  categories: { value: ProductCategory; count: number }[];
  brands: { slug: string; name: string; count: number }[];
  colours: { value: string; count: number }[];
  priceRange: { min: number; max: number };
}

export interface BrandSummary extends BrandRef {
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  productCount: number;
  partner: boolean;
}

export interface ProductFilters {
  q?: string;
  brand?: string[];
  category?: ProductCategory[];
  gender?: Gender;
  style?: WearStyle;
  colour?: string[];
  occasion?: Occasion[];
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  liveTryOn?: boolean;
  sort?: 'featured' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}
