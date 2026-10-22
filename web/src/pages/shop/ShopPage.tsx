import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { getFacets } from '../../api/catalogue.api';
import { ProductCard } from '../../components/catalogue/ProductCard';
import { WishlistHeart } from '../../components/catalogue/WishlistHeart';
import { RevealText } from '../../components/motion/RevealText';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useInfiniteProducts } from '../../hooks/useInfiniteProducts';
import { useProductFilters } from '../../hooks/useProductFilters';
import type { ProductFilters } from '../../types/catalogue';
import { FilterPanel } from './FilterPanel';

const SORTS: { value: NonNullable<ProductFilters['sort']>; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

function SkeletonCard() {
  return (
    <div>
      <div className="aspect-[3/4] animate-pulse bg-sand" />
      <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-sand" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-sand" />
    </div>
  );
}

export function ShopPage() {
  const filterApi = useProductFilters();
  const { filters, setFilter, clearAll, activeCount } = filterApi;
  const facets = useApi((signal) => getFacets(signal));
  const [search, setSearch] = useState(filters.q ?? '');
  const debouncedSearch = useDebounce(search);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { items, total, loading, error, hasMore, loadMore } = useInfiniteProducts(filters);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearch !== (filters.q ?? '')) setFilter('q', debouncedSearch.trim() || undefined);
  }, [debouncedSearch, filters.q, setFilter]);

  // Load the next page when the sentinel below the grid comes near the viewport.
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), {
      rootMargin: '600px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 md:px-10">
      <header className="flex flex-col gap-6 border-b border-hairline pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-muted">Catalogue</p>
          <RevealText
            as="h1"
            text="Every piece, *one place.*"
            className="mt-3 text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-[-0.02em]"
          />
          <p className="mt-3 text-sm text-muted">
            {loading && items.length === 0 ? 'Loading…' : `${total.toLocaleString('en-PK')} pieces in stock`}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative">
            <span className="sr-only">Search the catalogue</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lawn, kurta, Maria B…"
              className="w-full rounded-full border border-hairline bg-card py-3 pr-4 pl-5 text-sm transition-colors focus:border-ink focus:outline-none sm:w-72"
            />
          </label>
          <select
            value={filters.sort ?? 'featured'}
            onChange={(event) => setFilter('sort', event.target.value as ProductFilters['sort'])}
            className="rounded-full border border-hairline bg-card px-4 py-3 text-sm"
            aria-label="Sort by"
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full border border-ink px-5 py-3 text-sm lg:hidden"
          >
            Filters{activeCount > 0 && ` (${activeCount})`}
          </button>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 no-scrollbar" data-lenis-prevent>
            {activeCount > 0 && (
              <button type="button" onClick={clearAll} className="mb-2 text-xs underline underline-offset-4">
                Clear all filters ({activeCount})
              </button>
            )}
            <FilterPanel facets={facets.data} api={filterApi} />
          </div>
        </aside>

        <div>
          {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-900">{error}</p>}
          {!loading && items.length === 0 && !error && (
            <div className="py-24 text-center">
              <p className="font-logo text-4xl italic">Nothing here yet</p>
              <p className="mt-3 text-muted">Try fewer filters or a different search.</p>
              <button type="button" onClick={clearAll} className="mt-6 rounded-full bg-ink px-6 py-3 text-sm text-paper">
                Clear filters
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {items.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} action={<WishlistHeart productId={product.id} />} />
            ))}
            {loading && Array.from({ length: items.length === 0 ? 8 : 4 }, (_, i) => <SkeletonCard key={`s${i}`} />)}
          </div>
          {hasMore && <div ref={sentinel} className="h-10" aria-hidden />}
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 36 }}
              className="fixed inset-y-0 right-0 z-50 w-[88vw] max-w-sm overflow-y-auto bg-paper px-6 py-6"
              data-lenis-prevent
              role="dialog"
              aria-label="Filters"
            >
              <div className="flex items-center justify-between">
                <p className="text-lg">Filters</p>
                <button type="button" onClick={() => setDrawerOpen(false)} className="text-sm underline">
                  Done
                </button>
              </div>
              <FilterPanel facets={facets.data} api={filterApi} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
