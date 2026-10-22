import { Home, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef } from 'react';
import { Link } from 'react-router';
import { Stars } from '../../components/ui/Display';
import { SPECIALITY_LABEL, type Tailor } from '../../types/tailors';
import { cn, formatPrice } from '../../utils/format';

interface TailorCardProps {
  tailor: Tailor;
  rank: number;
  best: boolean;
  active: boolean;
  /** Query string to carry into the tailor page (?tryOn=..., ?outfit=...). */
  carry: string;
  onHover: (id: string | null) => void;
}

/** One tailor in the map list. Highlights its pin on hover; the map highlights the card back. */
export const TailorCard = forwardRef<HTMLAnchorElement, TailorCardProps>(function TailorCard({ tailor, rank, best, active, carry, onHover }, ref) {
  const positive = tailor.sentimentAvg !== null ? Math.round(tailor.sentimentAvg * 100) : null;
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Link
        ref={ref}
        to={`/tailors/${tailor.slug}${carry}`}
        onMouseEnter={() => onHover(tailor.id)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          'relative block rounded-[22px] border bg-card p-5 transition-all duration-300',
          active ? 'border-ink shadow-[0_24px_50px_-30px_rgba(43,41,38,0.7)]' : 'border-hairline hover:border-ink/40',
        )}
      >
        {best && (
          <span className="eyebrow absolute -top-2.5 left-5 rounded-full bg-henna px-2.5 py-1 text-[10px] text-paper">Kapra’s best match</span>
        )}
        <div className="flex items-start gap-4">
          <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full font-logo text-xl italic', best ? 'bg-henna text-paper' : 'bg-paper')}>{rank}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-lg leading-tight">{tailor.businessName}</h3>
              {tailor.distanceKm !== null && tailor.distanceKm !== undefined && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                  <Navigation size={11} /> {tailor.distanceKm} km
                </span>
              )}
            </div>
            <p className="truncate text-sm text-muted">
              {tailor.address}, {tailor.city}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                <Stars value={tailor.ratingAvg} size={13} /> {tailor.ratingAvg.toFixed(1)} <span className="text-muted">({tailor.ratingCount})</span>
              </span>
              {positive !== null && <span className="text-xs text-olive">{positive}% positive words</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tailor.specialities.slice(0, 3).map((speciality) => (
                <span key={speciality} className="rounded-full bg-paper px-2.5 py-1 text-[11px]">
                  {SPECIALITY_LABEL[speciality]}
                </span>
              ))}
              {tailor.homeVisits && (
                <span className="flex items-center gap-1 rounded-full bg-olive/10 px-2.5 py-1 text-[11px] text-olive">
                  <Home size={10} /> Home visits
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-hairline/70 pt-3 text-sm">
          <span className="text-muted">
            From <span className="text-ink">{tailor.priceFrom ? formatPrice(tailor.priceFrom) : '—'}</span> · {tailor.turnaroundDays} days
          </span>
          <span className="font-semibold">
            Score <span className="font-logo text-lg italic">{Math.round(tailor.rankScore * 100)}</span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
});
