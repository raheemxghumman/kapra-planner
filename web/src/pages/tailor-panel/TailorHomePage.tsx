import { ArrowRight, Hourglass, Scissors, Star, Trophy } from 'lucide-react';
import { Link } from 'react-router';
import { listBookings } from '../../api/bookings.api';
import { getOwnTailorProfile } from '../../api/tailors.api';
import { ButtonLink } from '../../components/ui/Button';
import { Stat, Stars } from '../../components/ui/Display';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { BOOKING_STATUS_LABEL } from '../../types/bookings';
import { formatPrice } from '../../utils/format';
import { bookingTone } from '../../utils/status';
import { formatDateTime, greeting } from '../../utils/time';

export function TailorHomePage() {
  const { user } = useAuth();
  const shop = useApi((signal) => getOwnTailorProfile(signal));
  const requested = useApi((signal) => listBookings({ status: 'requested', limit: 5 }, signal));
  const working = useApi((signal) => listBookings({ status: 'in_progress', limit: 1 }, signal));
  const accepted = useApi((signal) => listBookings({ status: 'accepted', limit: 1 }, signal));
  useRealtimeEvent('booking.updated', () => {
    requested.reload();
    working.reload();
    accepted.reload();
  });

  const profile = shop.data?.profile;
  if (shop.loading) return <Skeleton className="h-96" />;

  if (!profile) {
    return (
      <div>
        <PageHeader eyebrow={greeting()} title="Welcome," accent={user?.name.split(' ')[0]} />
        <Panel>
          <EmptyState
            title="Set up your shop"
            description="Add your address, specialities and prices. Customers find you on the Kapra map once an admin verifies your account."
            action={<ButtonLink to="/tailor/shop">Set up my shop</ButtonLink>}
          />
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={greeting()}
        title={profile.businessName.split(' ')[0]}
        accent="studio"
        description={shop.data?.approved ? 'Your shop is live on the Kapra map.' : 'Waiting for an admin to verify your account; your shop is hidden until then.'}
        actions={<ButtonLink to={`/tailors/${profile.slug}`} variant="ghost">View public page</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="New requests" value={requested.data?.meta.total ?? 0} icon={<Hourglass size={16} />} note="Waiting for you to accept" />
        <Stat label="In the workshop" value={(working.data?.meta.total ?? 0) + (accepted.data?.meta.total ?? 0)} icon={<Scissors size={16} />} note="Accepted or stitching" />
        <Stat label="Rating" value={profile.ratingAvg} format={(n) => n.toFixed(1)} icon={<Star size={16} />} note={`${profile.ratingCount} reviews`} />
        <Stat label="Kapra score" value={profile.rankScore * 100} icon={<Trophy size={16} />} note="Rating, review words and reliability" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel eyebrow="Needs you" title="New booking requests" actions={<Link to="/tailor/bookings" className="text-sm text-muted hover:text-ink">All bookings</Link>}>
          {requested.loading ? (
            <Skeleton className="h-40" />
          ) : requested.data?.data.length === 0 ? (
            <EmptyState title="All caught up" description="New paid requests appear here instantly." className="py-8" />
          ) : (
            <ul className="space-y-3">
              {requested.data?.data.map((booking) => (
                <li key={booking.id}>
                  <Link to={`/tailor/bookings/${booking.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-paper/50 p-4 transition-colors hover:border-ink">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{booking.serviceName}</p>
                      <p className="text-sm text-muted">
                        {booking.customer.name} · {booking.handoff === 'home_visit' ? 'Home visit' : 'Drop-off'} {formatDateTime(booking.appointmentAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill tone={bookingTone(booking.status)} pulse>
                        {BOOKING_STATUS_LABEL[booking.status]}
                      </StatusPill>
                      <span className="text-sm font-semibold">{formatPrice(booking.price)}</span>
                      <ArrowRight size={16} className="text-muted" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel eyebrow="How you rank" title="Your score explained" delay={0.06}>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Average rating</span>
              <span className="flex items-center gap-2">
                <Stars value={profile.ratingAvg} /> {profile.ratingAvg.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>What reviews say</span>
              <span>{profile.sentimentAvg !== null ? `${Math.round(profile.sentimentAvg * 100)}% positive` : 'Not scored yet'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Orders finished</span>
              <span>
                {profile.completedOrders} done · {profile.cancelledOrders} declined
              </span>
            </div>
            <p className="rounded-xl bg-paper/70 p-3 text-xs leading-relaxed text-muted">
              Score = 55% rating (Bayesian average) + 30% review sentiment from a pre-trained language model + 15% completion rate. Reply to reviews and finish orders on time to rise.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
