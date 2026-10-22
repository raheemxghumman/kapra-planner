import { createContext } from 'react';

/** One size of one product in the cart. Prices are shown from here but re-checked at checkout. */
export interface CartItem {
  variantId: string;
  productId: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  title: string;
  size: string;
  image: string | null;
  price: number;
  quantity: number;
}

export interface CartGroup {
  brandId: string;
  brandName: string;
  brandSlug: string;
  items: CartItem[];
  subtotal: number;
}

export interface CartContextValue {
  items: CartItem[];
  groups: CartGroup[];
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clearBrand: (brandId: string) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export const MAX_PER_LINE = 5;
