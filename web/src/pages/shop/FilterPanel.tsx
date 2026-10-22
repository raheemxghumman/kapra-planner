import type { useProductFilters } from '../../hooks/useProductFilters';
import type { Facets, Gender, Occasion, WearStyle } from '../../types/catalogue';
import { COLOUR_HEX } from '../../utils/colours';
import { cn, labelOf } from '../../utils/format';

type FilterApi = ReturnType<typeof useProductFilters>;

const OCCASIONS: Occasion[] = ['casual', 'office', 'festive', 'formal', 'wedding', 'party'];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-hairline py-6">
      <legend className="eyebrow float-left mb-4 w-full text-muted">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs transition-colors duration-300',
        active ? 'border-ink bg-ink text-paper' : 'border-hairline hover:border-ink',
      )}
    >
      {children}
    </button>
  );
}

/** Sidebar filters built from live facet counts. */
export function FilterPanel({ facets, api }: { facets?: Facets; api: FilterApi }) {
  const { filters, setFilter, toggleInList } = api;

  return (
    <div>
      <Group title="Style">
        <div className="flex flex-wrap gap-2">
          {(['eastern', 'western'] as WearStyle[]).map((style) => (
            <Chip
              key={style}
              active={filters.style === style}
              onClick={() => setFilter('style', filters.style === style ? undefined : style)}
            >
              {labelOf(style)}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="For">
        <div className="flex flex-wrap gap-2">
          {(['women', 'men'] as Gender[]).map((gender) => (
            <Chip
              key={gender}
              active={filters.gender === gender}
              onClick={() => setFilter('gender', filters.gender === gender ? undefined : gender)}
            >
              {labelOf(gender)}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          {facets?.categories.map((item) => (
            <Chip
              key={item.value}
              active={filters.category?.includes(item.value) ?? false}
              onClick={() => toggleInList('category', item.value)}
            >
              {labelOf(item.value)} <span className="opacity-50">{item.count}</span>
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Occasion">
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((occasion) => (
            <Chip
              key={occasion}
              active={filters.occasion?.includes(occasion) ?? false}
              onClick={() => toggleInList('occasion', occasion)}
            >
              {labelOf(occasion)}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {facets?.colours.map((item) => {
            const active = filters.colour?.includes(item.value) ?? false;
            return (
              <button
                type="button"
                key={item.value}
                title={`${labelOf(item.value)} (${item.count})`}
                aria-label={labelOf(item.value)}
                aria-pressed={active}
                onClick={() => toggleInList('colour', item.value)}
                className={cn(
                  'h-7 w-7 rounded-full border border-ink/15 transition-transform duration-300 hover:scale-110',
                  active && 'ring-2 ring-ink ring-offset-2 ring-offset-paper',
                )}
                style={{ background: COLOUR_HEX[item.value] ?? '#ccc' }}
              />
            );
          })}
        </div>
      </Group>

      <Group title="Price (Rs)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(facets?.priceRange.min ?? 0)}
            value={filters.minPrice ?? ''}
            onChange={(event) => setFilter('minPrice', Number(event.target.value) || undefined)}
            className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-sm"
            aria-label="Minimum price"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(facets?.priceRange.max ?? '')}
            value={filters.maxPrice ?? ''}
            onChange={(event) => setFilter('maxPrice', Number(event.target.value) || undefined)}
            className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-sm"
            aria-label="Maximum price"
          />
        </div>
      </Group>

      <Group title="Brand">
        <ul className="space-y-2">
          {facets?.brands.map((brand) => {
            const active = filters.brand?.includes(brand.slug) ?? false;
            return (
              <li key={brand.slug}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleInList('brand', brand.slug)}
                      className="h-4 w-4 accent-ink"
                    />
                    {brand.name}
                  </span>
                  <span className="text-xs text-muted">{brand.count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Group>
    </div>
  );
}
