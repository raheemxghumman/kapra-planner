import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CartContext, MAX_PER_LINE, type CartGroup, type CartItem } from './cart-context';

const STORAGE_KEY = 'kapra.cart';

function loadCart(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

/**
 * The shopping cart, kept in localStorage so it survives reloads. Items are grouped by brand
 * because each partner brand ships its own order.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((all) => {
      const existing = all.find((line) => line.variantId === item.variantId);
      if (existing) {
        return all.map((line) =>
          line.variantId === item.variantId ? { ...line, quantity: Math.min(MAX_PER_LINE, line.quantity + quantity) } : line,
        );
      }
      return [...all, { ...item, quantity: Math.min(MAX_PER_LINE, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((all) =>
      quantity <= 0
        ? all.filter((line) => line.variantId !== variantId)
        : all.map((line) => (line.variantId === variantId ? { ...line, quantity: Math.min(MAX_PER_LINE, quantity) } : line)),
    );
  }, []);

  const remove = useCallback((variantId: string) => setItems((all) => all.filter((line) => line.variantId !== variantId)), []);
  const clearBrand = useCallback((brandId: string) => setItems((all) => all.filter((line) => line.brandId !== brandId)), []);

  const groups = useMemo(() => {
    const byBrand = new Map<string, CartGroup>();
    for (const item of items) {
      const group = byBrand.get(item.brandId) ?? {
        brandId: item.brandId,
        brandName: item.brandName,
        brandSlug: item.brandSlug,
        items: [],
        subtotal: 0,
      };
      group.items.push(item);
      group.subtotal += item.price * item.quantity;
      byBrand.set(item.brandId, group);
    }
    return [...byBrand.values()];
  }, [items]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({ items, groups, count, open, setOpen, add, setQuantity, remove, clearBrand }),
    [items, groups, count, open, add, setQuantity, remove, clearBrand],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
