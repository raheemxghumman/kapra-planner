import { CalendarClock, CheckCircle2, Home, MapPin, Phone, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { getTailor, getTailorReviews } from '../../api/tailors.api';
import { BreakdownBars } from '../../components/charts/Charts';
import { MapView } from '../../components/map/MapView';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Stars } from '../../components/ui/Display';
import { ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { SPECIALITY_LABEL, type PublicReview } from '../../types/tailors';
import { formatPrice, labelOf } from '../../utils/format';
import { timeAgo } from '../../utils/time';

const SENTIMENT_TONE = { positive: 'olive', neutral: 'sand', negative: 'henna' } as const;

/** A tailor's public page: who they are, prices, the score explained, reviews and location. */
export function TailorPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const tailor = useApi((signal) => getTailor(slug, signal), [slug]);
  // The page shows the newest 6 reviews; "More reviews" loads pages of 10 from the start and
  // skips the ones already shown.
  const [loadedPages, setLoadedPages] = useState(0);
  const [more, setMore] = useState<PublicReview[]>([]);
  const loadMore = useAction(async () => {
    const next = loadedPages + 1;
    const result = await getTailorReviews(slug, next);
    setMore((current) => [...current, ...result.data]);
    setLoadedPages(next);
  });

  if (tailor.loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-28">
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (tailor.error || !tailor.data) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-36 pb-24">
        <ErrorNote message={tailor.error ?? 'Tailor not found'} />
      </div>
    );
  }

  const t = tailor.data;
  const reviews = [...t.reviews, ...more.filter((review, index, all) => !t.reviews.some((first) => first.id === review.id) && all.findIndex((other) => other.id === review.id) === index)];
  const total = t.ratingBreakdown.reduce((sum, row) => sum + row.count, 0);
  const completion = t.completedOrders + t.cancelledOrders >= 3 ? Math.round((t.completedOrders / (t.completedOrders + t.cancelledOrders)) * 100) : null;
  const carry = params.toString() ? `&${params.toString()}` : '';
  const bookLink = (serviceId: string) => (user ? `/app/book/${t.slug}?service=${serviceId}${carry}` : `/login`);
  const monogram = t.businessName
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-24 md:px-8">
      <Link to="/tailors" className="eyebrow text-muted hover:text-ink">
        ← All tailors
      </Link>

      <header className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-end">
        <motion.div initial={{ scale: 0.8, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }} className="grid h-36 w-36 place-items-center rounded-[36px] bg-ink font-logo text-6xl text-paper italic">
          {monogram}
        </motion.div>
        <div>
          <div className="flex flex-wrap gap-2">
            {t.specialities.map((speciality) => (
              <StatusPill key={speciality} tone="sand">
                {SPECIALITY_LABEL[speciality]}
              </StatusPill>
            ))}
          </div>
          <h1 className="mt-3 text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-[-0.03em]">{t.businessName}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5 text-ink">
              <Stars value={t.ratingAvg} /> {t.ratingAvg.toFixed(1)} · {t.ratingCount} reviews
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {t.address}, {t.city}
            </span>
          </p>
        </div>
        <div className="rounded-[22px] border border-hairline bg-card p-5 text-center">
          <p className="eyebrow text-muted">Kapra score</p>
          <p className="font-logo text-6xl leading-none italic">{Math.round(t.rankScore * 100)}</p>
          <p className="mt-1 text-xs text-muted">out of 100</p>
        </div>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-12">
          {t.bio && <p className="text-lg leading-relaxed text-ink/80">{t.bio}</p>}

          <section>
            <h2 className="text-2xl">
              Services <span className="font-logo italic">&amp; prices</span>
            </h2>
            <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
              {t.services.map((service, index) => (
                <motion.li key={service.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="flex flex-wrap items-center gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg">{service.name}</p>
                    <p className="text-sm text-muted">
                      {labelOf(service.type)} · ready in about {service.durationDays} day{service.durationDays > 1 ? 's' : ''}
                    </p>
                    {service.description && <p className="mt-1 text-sm text-ink/70">{service.description}</p>}
                  </div>
                  <p className="font-logo text-2xl italic">{formatPrice(service.price)}</p>
                  {user?.role === 'customer' || !user ? (
                    <ButtonLink to={bookLink(service.id)} size="sm">
                      <Scissors size={13} /> Book
                    </ButtonLink>
                  ) : null}
                </motion.li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl">
              What customers <span className="font-logo italic">say</span>
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
              <div>
                <p className="font-logo text-6xl leading-none italic">{t.ratingAvg.toFixed(1)}</p>
                <Stars value={t.ratingAvg} size={16} className="mt-2" />
                <p className="mt-1 text-sm text-muted">{t.ratingCount} reviews</p>
                {t.sentimentAvg !== null && <p className="mt-3 text-sm text-olive">The language model rates their reviews {Math.round(t.sentimentAvg * 100)}% positive.</p>}
              </div>
              <BreakdownBars items={t.ratingBreakdown.map((row) => ({ label: `${row.stars} star${row.stars > 1 ? 's' : ''}`, value: row.count, tone: row.stars >= 4 ? 'var(--color-olive)' : row.stars === 3 ? 'var(--color-stone)' : 'var(--color-henna)' }))} />
            </div>
            <ul className="mt-8 space-y-5">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-[20px] border border-hairline bg-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Stars value={review.rating} />
                      <span className="text-sm font-semibold">{review.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.sentimentLabel && <StatusPill tone={SENTIMENT_TONE[review.sentimentLabel]}>{review.sentimentLabel}</StatusPill>}
                      <span className="text-xs text-stone">{timeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                  {review.comment && <p className="mt-3 leading-relaxed">{review.comment}</p>}
                  {review.reply && (
                    <p className="mt-3 border-l-2 border-olive pl-3 text-sm text-ink/70">
                      <span className="font-semibold">Reply:</span> {review.reply}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {reviews.length < total && (
              <Button variant="ghost" className="mt-6" loading={loadMore.running} onClick={() => loadMore.run()}>
                More reviews
              </Button>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="h-64 overflow-hidden rounded-[22px] border border-hairline">
            <MapView markers={[{ id: t.id, lat: t.lat, lng: t.lng, kind: 'tailor', rank: 1 }]} center={{ lat: t.lat, lng: t.lng }} zoom={15} activeId={t.id} />
          </div>
          <dl className="space-y-4 rounded-[22px] border border-hairline bg-card p-6 text-sm">
            <Fact icon={CalendarClock} label="Usual turnaround" value={`${t.turnaroundDays} days`} />
            <Fact icon={Home} label="Home visits" value={t.homeVisits ? 'Yes, for measurements and pickup' : 'No, drop off at the shop'} />
            <Fact icon={CheckCircle2} label="Orders finished" value={`${t.completedOrders}${completion !== null ? ` · ${completion}% completion` : ''}`} />
            <Fact icon={Phone} label="Phone" value={t.phone} />
          </dl>
          {t.services[0] && (
            <ButtonLink to={bookLink(t.services[0].id)} size="lg" className="w-full">
              Book {t.businessName.split(' ')[0]}
            </ButtonLink>
          )}
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-muted" />
      <div>
        <dt className="eyebrow text-muted">{label}</dt>
        <dd className="mt-0.5">{value}</dd>
      </div>
    </div>
  );
}
