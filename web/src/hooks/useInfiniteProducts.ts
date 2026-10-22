import { isCancel } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { searchProducts } from '../api/catalogue.api';
import type { Product, ProductFilters } from '../types/catalogue';
import { getErrorMessage } from '../utils/errors';

const PAGE_SIZE = 24;

interface Loaded {
  /** Which request (filters + page) this result answers. */
  key: string;
  items: Product[];
  total: number;
  error: string | null;
}

/**
 * Loads catalogue pages one after another.
 * - The page number is stored with the filters it belongs to, so new filters mean page 1.
 * - "Loading" is derived: the newest finished request is not the one we want yet.
 * - An in-flight request for old filters is aborted so it cannot mix into new results.
 */
export function useInfiniteProducts(filters: ProductFilters) {
  const filtersKey = JSON.stringify(filters);
  const [paging, setPaging] = useState({ key: filtersKey, page: 1 });
  const page = paging.key === filtersKey ? paging.page : 1;
  const requestKey = `${filtersKey}#${page}`;

  const [loaded, setLoaded] = useState<Loaded>({ key: '', items: [], total: 0, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const request = JSON.parse(filtersKey) as ProductFilters;
    searchProducts({ ...request, page, limit: PAGE_SIZE }, controller.signal)
      .then((result) =>
        setLoaded((previous) => ({
          key: `${filtersKey}#${page}`,
          items: page === 1 ? result.data : [...previous.items, ...result.data],
          total: result.meta.total,
          error: null,
        })),
      )
      .catch((error: unknown) => {
        if (isCancel(error)) return;
        setLoaded((previous) => ({ ...previous, key: `${filtersKey}#${page}`, error: getErrorMessage(error) }));
      });
    return () => controller.abort();
  }, [filtersKey, page]);

  const loading = loaded.key !== requestKey;
  // While page 1 of new filters loads, show nothing rather than the old filters' products.
  const items = loading && page === 1 ? [] : loaded.items;
  const hasMore = items.length < loaded.total;

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPaging({ key: filtersKey, page: page + 1 });
  }, [loading, hasMore, filtersKey, page]);

  return { items, total: loaded.total, loading, error: loading ? null : loaded.error, hasMore, loadMore };
}
