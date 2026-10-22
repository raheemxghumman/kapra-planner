import { Crosshair, Info, Search, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getBrandStores, searchPlaces, searchTailors } from '../../api/tailors.api';
import { MapView, type MapMarker } from '../../components/map/MapView';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { SPECIALITY_LABEL, type TailorSort, type TailorSpeciality } from '../../types/tailors';
import { cn } from '../../utils/format';
import { ISLAMABAD } from '../../utils/geo';
import { TailorCard } from './TailorCard';

const RADII = [5, 10, 15, 25, 50];
const SORTS: { value: TailorSort; label: string }[] = [
  { value: 'best', label: 'Best match' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price', label: 'Price' },
];

/**
 * Find a tailor: list and map side by side. "Best match" orders by Kapra's score (ratings,
 * what reviews say, completed orders); the map can also show partner brands' stores.
 */
export function TailorsPage() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [place, setPlace] = useState<{ lat: number; lng: number; label: string }>({ ...ISLAMABAD, label: 'Islamabad' });
  const [placeQuery, setPlaceQuery] = useState('');
  const [radiusKm, setRadius] = useState(15);
  const [speciality, setSpeciality] = useState<TailorSpeciality | null>((params.get('speciality') as TailorSpeciality) ?? null);
  const [sort, setSort] = useState<TailorSort>('best');
  const [minRating, setMinRating] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [explain, setExplain] = useState(false);
  const cards = useRef(new Map<string, HTMLAnchorElement>());

  const query = useDebounce(q);
  const tailors = useApi(
    (signal) =>
      searchTailors(
        { q: query || undefined, lat: place.lat, lng: place.lng, radiusKm, speciality: speciality ?? undefined, sort, minRating: minRating ? 4 : undefined, limit: 30 },
        signal,
      ),
    [query, place.lat, place.lng, radiusKm, speciality, sort, minRating],
  );
  const stores = useApi((signal) => (showStores ? getBrandStores(signal) : Promise.resolve([])), [showStores]);

  // Keep ?tryOn / ?outfit / ?product so the booking can attach the look.
  const carry = ['tryOn', 'outfit', 'product'].some((key) => params.get(key)) ? `?${params.toString()}` : '';

  const markers = useMemo<MapMarker[]>(
    () => [
      { id: 'me', lat: place.lat, lng: place.lng, kind: 'me' },
      ...(tailors.data?.data ?? []).map((tailor, index) => ({ id: tailor.id, lat: tailor.lat, lng: tailor.lng, kind: 'tailor' as const, rank: index + 1, title: tailor.businessName })),
      ...(stores.data ?? []).map((store) => ({ id: `store-${store.id}`, lat: store.lat, lng: store.lng, kind: 'store' as const, title: `${store.brandName} — ${store.name}` })),
    ],
    [place, tailors.data, stores.data],
  );

  const locate = () => {
    if (!navigator.geolocation) return toast({ title: 'Location is not available in this browser', tone: 'error' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude, label: 'Your location' };
        setPlace(next);
        setFocus({ lat: next.lat, lng: next.lng, zoom: 13 });
      },
      () => toast({ title: 'Location permission was refused', description: 'Search for your area instead.', tone: 'info' }),
    );
  };

  const findPlace = async () => {
    if (placeQuery.trim().length < 2) return;
    const [found] = await searchPlaces(placeQuery.trim()).catch(() => []);
    if (!found) return toast({ title: 'Place not found', description: 'Try an area and city, e.g. "Gulberg Lahore".', tone: 'info' });
    setPlace(found);
    setFocus({ lat: found.lat, lng: found.lng, zoom: 12 });
  };

  const selectFromMap = (id: string) => {
    if (id.startsWith('store-')) return;
    setHovered(id);
    cards.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-20 pb-16 md:px-8">
      <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
        <section>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[clamp(2.2rem,4vw,3.4rem)] leading-[1] tracking-[-0.03em]">
            Tailors <span className="font-logo italic">near you</span>
          </motion.h1>
          <p className="mt-2 text-sm text-muted">
            Ranked by ratings, what customers wrote and finished orders.{' '}
            <button type="button" onClick={() => setExplain(true)} className="inline-flex items-center gap-1 text-ink underline underline-offset-4">
              <Info size={12} /> How
            </button>
          </p>

          <div className="mt-5 space-y-3 rounded-[22px] border border-hairline bg-card p-4">
            <div className="flex items-center gap-2 rounded-full border border-hairline bg-paper px-4">
              <Search size={15} className="text-muted" />
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Tailor name or area" className="w-full bg-transparent py-2.5 text-sm outline-none" />
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                findPlace();
              }}
              className="flex gap-2"
            >
              <input value={placeQuery} onChange={(event) => setPlaceQuery(event.target.value)} placeholder={`Near: ${place.label}`} className="min-w-0 flex-1 rounded-full border border-hairline bg-paper px-4 py-2.5 text-sm outline-none focus:border-olive" />
              <button type="button" onClick={locate} title="Use my location" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline hover:border-ink">
                <Crosshair size={15} />
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Within</span>
              {RADII.map((radius) => (
                <button key={radius} type="button" onClick={() => setRadius(radius)} className={cn('rounded-full px-3 py-1 text-xs transition-colors', radius === radiusKm ? 'bg-ink text-paper' : 'bg-paper hover:bg-sand')}>
                  {radius} km
                </button>
              ))}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(Object.keys(SPECIALITY_LABEL) as TailorSpeciality[]).map((value) => (
                <button key={value} type="button" onClick={() => setSpeciality(value === speciality ? null : value)} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors', value === speciality ? 'border-ink bg-ink text-paper' : 'border-hairline hover:border-ink')}>
                  {SPECIALITY_LABEL[value]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" checked={minRating} onChange={(event) => setMinRating(event.target.checked)} className="accent-[#2b2926]" /> 4★ and up
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" checked={showStores} onChange={(event) => setShowStores(event.target.checked)} className="accent-[#2b2926]" />
                <Store size={12} /> Show brand stores
              </label>
            </div>
          </div>

          <Tabs tabs={SORTS} value={sort} onChange={setSort} className="mt-4" />

          <div className="mt-4 h-[56vh] min-h-[420px] lg:h-[calc(100vh-29rem)]">
            <div data-lenis-prevent className="h-full space-y-4 overflow-y-auto px-1 pt-3 pb-6">
              {tailors.error && <ErrorNote message={tailors.error} onRetry={tailors.reload} />}
              {tailors.loading && !tailors.data ? (
                [0, 1, 2].map((key) => <Skeleton key={key} className="h-44" />)
              ) : tailors.data?.data.length === 0 ? (
                <EmptyState title="No tailors here yet" description="Try a bigger radius, another speciality or a different area." />
              ) : (
                tailors.data?.data.map((tailor, index) => (
                  <TailorCard
                    key={tailor.id}
                    ref={(element) => {
                      if (element) cards.current.set(tailor.id, element);
                    }}
                    tailor={tailor}
                    rank={index + 1}
                    best={sort === 'best' && index === 0}
                    active={hovered === tailor.id}
                    carry={carry}
                    onHover={setHovered}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="order-first h-[46vh] overflow-hidden rounded-[28px] border border-hairline lg:sticky lg:top-20 lg:order-none lg:h-[calc(100vh-6.5rem)]">
          <MapView markers={markers} activeId={hovered} onSelect={selectFromMap} center={place} zoom={12} focus={focus} radiusKm={radiusKm} fit={false} />
        </section>
      </div>

      <Modal open={explain} onClose={() => setExplain(false)} title="How Kapra picks the best tailor">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>Every tailor gets a score from 0 to 100, recalculated after each review and every night:</p>
          <ul className="space-y-3">
            <li><b>55% rating</b> — a Bayesian average, so a tailor with one 5★ review does not beat one with fifty 4.8★ reviews.</li>
            <li><b>30% what reviews say</b> — a pre-trained multilingual language model reads each comment (English, Urdu or Roman Urdu) and scores how positive it is.</li>
            <li><b>15% reliability</b> — the share of bookings finished instead of declined.</li>
          </ul>
          <p className="text-muted">“Best match” sorts by this score within the distance you choose.</p>
        </div>
      </Modal>
    </div>
  );
}
