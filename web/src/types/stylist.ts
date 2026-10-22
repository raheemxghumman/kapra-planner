import type { Occasion, Product, ProductVariant, WearStyle } from './catalogue';

export type OutfitSlot = 'top' | 'bottom' | 'dupatta' | 'outer' | 'full_look' | 'shoes' | 'accessory';

export interface OutfitItem {
  id: string;
  productId: string;
  variantId: string | null;
  slot: OutfitSlot;
  reason: string | null;
  position: number;
  product: Product;
  variant?: ProductVariant | null;
}

export interface OutfitSuggestion {
  id: string;
  title: string;
  reason: string;
  totalPrice: number;
  rank: number;
  items: OutfitItem[];
}

export interface StylistRequest {
  id: string;
  occasion: Occasion;
  budget: number;
  style: WearStyle | null;
  colours: string[];
  notes: string | null;
  status: 'running' | 'completed' | 'failed';
  engine: 'ai' | 'rules' | null;
  durationMs: number | null;
  createdAt: string;
  suggestions: OutfitSuggestion[];
}

export interface StylistInput {
  occasion: Occasion;
  budget: number;
  style?: WearStyle;
  colours?: string[];
  notes?: string;
  anchorProductId?: string;
}

export interface Outfit {
  id: string;
  name: string;
  occasion: Occasion | null;
  suggestionId: string | null;
  createdAt: string;
  items: OutfitItem[];
}
