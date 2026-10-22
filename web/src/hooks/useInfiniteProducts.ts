import { isCancel } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { searchProducts } from '../api/catalogue.api';
import type { Product, ProductFilters } from '../types/catalogue';
import { getErrorMessage } from '../utils/errors';

const PAGE_SIZE = 24;

/**
 * Loads catalogue pages one after another. The page number is stored together with the
 * filters it belongs to, so new filters automatically mean page 1 (no extra effect, no race).
 * An in-flight request for old filters is aborted so it cannot mix into the new results.
 */
export function useInfiniteProducts(filters: ProductFilters) {
  const filtersKey = JSON.stringify(filters);
  const [paging, setPaging] = useState({ key: filtersKey, page: 1 });
  const page = paging.key === filtersKey ? paging.page : 1;

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    searchProducts({ ...(JSON.parse(filtersKey) as ProductFilters), page, limit: PAGE_SIZE }, controller.signal)
      .then((result) => {
        setItems((previous) => (page === 1 ? result.data : [...previous, ...result.data]));
        setTotal(result.meta.total);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isCancel(err)) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [filtersKey, page]);

  const hasMore = items.length < total;
  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPaging({ key: filtersKey, page: page + 1 });
  }, [loading, hasMore, filtersKey, page]);

  return { items, total, loading, error, hasMore, loadMore };
}
