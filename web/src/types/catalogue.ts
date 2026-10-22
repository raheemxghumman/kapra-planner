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
}

export interface ProductVariant {
  id: string;
  size: string;
  inStock: boolean;
  stockQty: number | null;
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
  sort?: 'featured' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}
