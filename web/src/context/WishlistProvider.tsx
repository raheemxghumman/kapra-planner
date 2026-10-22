import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { getWishlistIds, saveProduct, unsaveProduct } from '../api/customer.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { WishlistContext } from './wishlist-context';

/**
 * Which products the customer saved, for the heart icons everywhere. Changes are optimistic:
 * the heart fills at once and goes back if the server refuses.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    if (!isCustomer) return;
    const controller = new AbortController();
    getWishlistIds(controller.signal)
      .then((saved) => setIds(new Set(saved)))
      .catch(() => undefined);
    return () => {
      controller.abort();
      setIds(new Set());
    };
  }, [isCustomer]);

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    (productId: string) => {
      if (!user) {
        toast({ title: 'Log in to save pieces', tone: 'info' });
        navigate('/login', { state: { from: window.location.pathname } });
        return;
      }
      if (!isCustomer) return;
      const saving = !ids.has(productId);
      const apply = (add: boolean) =>
        setIds((current) => {
          const next = new Set(current);
          if (add) next.add(productId);
          else next.delete(productId);
          return next;
        });
      apply(saving);
      (saving ? saveProduct(productId) : unsaveProduct(productId))
        .then(() => saving && toast({ title: 'Saved', action: { label: 'View saved', to: '/app/saved' } }))
        .catch(() => {
          apply(!saving);
          toast({ title: 'Could not update your saved pieces', tone: 'error' });
        });
    },
    [user, isCustomer, ids, toast, navigate],
  );

  const value = useMemo(() => ({ has, toggle, count: ids.size }), [has, toggle, ids.size]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
