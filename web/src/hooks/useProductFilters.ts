import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { ProductFilters } from '../types/catalogue';

const LIST_KEYS = ['brand', 'category', 'colour', 'occasion'] as const;
const NUMBER_KEYS = ['minPrice', 'maxPrice'] as const;
const TEXT_KEYS = ['q', 'gender', 'style', 'size', 'sort'] as const;

/**
 * Catalogue filters stored in the URL (?category=kurta,dress&style=eastern).
 * The URL is the single source of truth: links are shareable and Back/Forward work.
 */
export function useProductFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<ProductFilters>(() => {
    const result: Record<string, unknown> = {};
    for (const key of LIST_KEYS) {
      const value = params.get(key);
      if (value) result[key] = value.split(',').filter(Boolean);
    }
    for (const key of NUMBER_KEYS) {
      const value = Number(params.get(key));
      if (value > 0) result[key] = value;
    }
    for (const key of TEXT_KEYS) {
      const value = params.get(key);
      if (value) result[key] = value;
    }
    return result as ProductFilters;
  }, [params]);

  const setFilter = useCallback(
    <K extends keyof ProductFilters>(key: K, value: ProductFilters[K] | undefined) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          const isEmpty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
          if (isEmpty) next.delete(key);
          else next.set(key, Array.isArray(value) ? value.join(',') : String(value));
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  /** Adds the value to a list filter, or removes it if already there. */
  const toggleInList = useCallback(
    (key: (typeof LIST_KEYS)[number], value: string) => {
      const current = (filters[key] as string[] | undefined) ?? [];
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      setFilter(key, next as never);
    },
    [filters, setFilter],
  );

  const clearAll = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const activeCount = [...params.keys()].filter((key) => key !== 'sort' && key !== 'q').length;

  return { filters, setFilter, toggleInList, clearAll, activeCount };
}
