import { ArrowRight, ScanFace, Scissors, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { listBookings, listOrders } from '../../api/bookings.api';
import { getFeaturedProducts } from '../../api/catalogue.api';
import { getStyleProfile, listOutfits } from '../../api/customer.api';
import { TiltCard } from '../../components/motion/TiltCard';
import { OutfitBoard } from '../../components/outfit/OutfitBoard';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { BOOKING_STATUS_LABEL, BOOKING_STEPS } from '../../types/bookings';
import { ORDER_STATUS_LABEL } from '../../types/orders';
import { formatPrice, imageUrl } from '../../utils/format';
import { formatDate, greeting } from '../../utils/time';
import { bookingTone, orderTone } from '../../utils/status';

const ACTIONS = [
  { to: '/app/stylist', title: 'Style me', line: 'Tell us the occasion and budget; the AI builds complete looks from 12 brands.', icon: Sparkles, bg: 'bg-ink text-paper' },
  { to: '/app/try-on', title: 'Try it on', line: 'See a piece on your own photo before you buy or stitch it.', icon: ScanFace, bg: 'bg-olive text-paper' },
  { to: '/tailors', title: 'Find a tailor', line: 'Ranked by reviews and what customers actually wrote.', icon: Scissors, bg: 'bg-henna text-paper' },
];

export function CustomerHomePage() {
  const { user } = useAuth();
  const featured = useApi((signal) => getFeaturedProducts(3, signal));
  const bookings = useApi((signal) => listBookings({ limit: 4 }, signal));
  const orders = useApi((signal) => listOrders({ limit: 3 }, signal));
  const outfits = useApi((signal) => listOutfits(signal));
  const profile = useApi((signal) => getStyleProfile(signal));

  // Statuses change while the page is open (tailor accepts, brand ships): refresh the lists.
  useRealtimeEvent('booking.updated', bookings.reload);
  useRealtimeEvent('order.updated', orders.reload);

  const firstName = user?.name.split(' ')[0] ?? '';
  const active = (bookings.data?.data ?? []).filter((booking) => !['completed', 'cancelled', 'declined'].includes(booking.status));
  const needsSizes = profile.data && !profile.data.sizes.top;

  return (
    <div>
      <header className="mb-10">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow text-muted">
          {greeting()}
        </motion.p>
        <h1 className="mt-2 overflow-hidden text-[clamp(2.4rem,5.5vw,4.4rem)] leading-[0.98] tracking-[-0.03em]">
          <motion.span className="block" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            Hello, <span className="font-logo pr-[0.05em] italic">{firstName}</span>.
          </motion.span>
        </h1>
        <p className="mt-3 text-muted">What are we dressing for today?</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ACTIONS.map((action, index) => (
          <motion.div key={action.to} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <TiltCard className="h-full">
              <Link to={action.to} className={`relative flex h-64 flex-col justify-between overflow-hidden rounded-[24px] p-6 ${action.bg}`}>
                {featured.data?.[index] && (
                  <img
                    src={imageUrl(featured.data[index].images[0], 500)}
                    alt=""
                    className="absolute -right-6 -bottom-10 h-56 w-40 rotate-6 rounded-xl object-cover opacity-35 mix-blend-luminosity transition-all duration-700 group-hover:-translate-y-2 group-hover:rotate-2 group-hover:opacity-60"
                  />
                )}
                <div className="relative flex items-center justify-between" style={{ transform: 'translateZ(30px)' }}>
                  <action.icon size={22} strokeWidth={1.6} />
                  <span className="font-logo text-lg italic opacity-70">0{index + 1}</span>
                </div>
                <div className="relative" style={{ transform: 'translateZ(40px)' }}>
                  <p className="text-[1.9rem] leading-none tracking-[-0.02em]">{action.title}</p>
                  <p className="mt-2 max-w-[15rem] text-sm leading-relaxed opacity-75">{action.line}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                    Start <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {needsSizes && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-dashed border-stone/70 px-5 py-4">
          <p className="text-sm">
            <span className="font-semibold">Add your sizes and colours</span> <span className="text-muted">so the stylist picks pieces that fit you.</span>
          </p>
          <ButtonLink to="/app/profile" size="sm" variant="ghost">
            Complete profile
          </ButtonLink>
        </motion.div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel eyebrow="In progress" title="Bookings & orders" className="lg:col-span-3" delay={0.15}>
          {bookings.loading || orders.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : active.length === 0 && !orders.data?.data.length ? (
            <EmptyState title="Nothing stitching yet" description="Book a tailor after you try a look on, or order from a partner brand." className="py-8" />
          ) : (
            <ul className="space-y-3">
              {active.map((booking) => {
                const step = BOOKING_STEPS.findIndex((item) => item.status === booking.status);
                return (
                  <li key={booking.id}>
                    <Link to={`/app/bookings/${booking.id}`} className="block rounded-2xl border border-hairline bg-paper/50 p-4 transition-colors hover:border-ink">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{booking.serviceName}</p>
                          <p className="text-xs text-muted">
                            {booking.tailor.businessName} · {booking.code}
                          </p>
                        </div>
                        <StatusPill tone={bookingTone(booking.status)} pulse={booking.status === 'in_progress'}>
                          {BOOKING_STATUS_LABEL[booking.status]}
                        </StatusPill>
                      </div>
                      <div className="mt-3 flex gap-1">
                        {BOOKING_STEPS.map((item, index) => (
                          <motion.span
                            key={item.status}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3 + index * 0.08 }}
                            className={`h-1 flex-1 origin-left rounded-full ${index <= step ? 'bg-olive' : 'bg-hairline'}`}
                          />
                        ))}
                      </div>
                    </Link>
                  </li>
                );
              })}
              {orders.data?.data.map((order) => (
                <li key={order.id}>
                  <Link to={`/app/orders/${order.id}`} className="flex items-center gap-3 rounded-2xl border border-hairline bg-paper/50 p-4 transition-colors hover:border-ink">
                    <img src={imageUrl(order.items[0]?.image ?? undefined, 120)} alt="" className="h-12 w-10 rounded-md bg-sand object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {order.brand.name} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted">
                        {order.code} · {formatPrice(order.total)} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <StatusPill tone={orderTone(order.status)}>{ORDER_STATUS_LABEL[order.status]}</StatusPill>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel eyebrow="Saved looks" title="Your outfits" className="lg:col-span-2" delay={0.22} actions={<Link to="/app/outfits" className="text-sm text-muted hover:text-ink">All</Link>}>
          {outfits.loading ? (
            <Skeleton className="h-56" />
          ) : outfits.data?.length ? (
            <Link to={`/app/outfits/${outfits.data[0].id}`} className="block">
              <OutfitBoard items={outfits.data[0].items} compact linked={false} />
              <p className="mt-4 text-sm font-semibold">{outfits.data[0].name}</p>
              <p className="text-xs text-muted">{outfits.data.length} saved look{outfits.data.length > 1 ? 's' : ''}</p>
            </Link>
          ) : (
            <EmptyState title="No looks yet" description="Ask the stylist and save the ones you love." action={<ButtonLink to="/app/stylist" size="sm">Style me</ButtonLink>} className="py-6" />
          )}
        </Panel>
      </div>
    </div>
  );
}
