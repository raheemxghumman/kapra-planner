import { createContext } from 'react';

export interface WishlistContextValue {
  has: (productId: string) => boolean;
  /** Saves or unsaves; asks visitors to log in first. */
  toggle: (productId: string) => void;
  count: number;
}

export const WishlistContext = createContext<WishlistContextValue | null>(null);
