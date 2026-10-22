import { CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { listBookings } from '../../api/bookings.api';
import { ButtonLink } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Display';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { BOOKING_STATUS_LABEL, type BookingStatus } from '../../types/bookings';
import { formatPrice, imageUrl } from '../../utils/format';
import { bookingTone } from '../../utils/status';
import { formatDateTime, timeAgo } from '../../utils/time';

type Filter = 'all' | BookingStatus;

/** Bookings list for customers (/app/bookings) and tailors (/tailor/bookings). */
export function BookingsListPage() {
  const { user } = useAuth();
  const asTailor = user?.role === 'tailor';
  const [filter, setFilter] = useState<Filter>(asTailor ? 'requested' : 'all');
  const bookings = useApi((signal) => listBookings({ status: filter === 'all' ? undefined : filter, limit: 40 }, signal), [filter]);
  useRealtimeEvent('booking.updated', bookings.reload);

  const base = asTailor ? '/tailor/bookings' : '/app/bookings';
  const tabs: { value: Filter; label: string }[] = asTailor
    ? [
        { value: 'requested', label: 'New requests' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'in_progress', label: 'Stitching' },
        { value: 'ready', label: 'Ready' },
        { value: 'completed', label: 'Completed' },
        { value: 'all', label: 'All' },
      ]
    : [
        { value: 'all', label: 'All' },
        { value: 'pending_payment', label: 'To pay' },
        { value: 'in_progress', label: 'Stitching' },
        { value: 'ready', label: 'Ready' },
        { value: 'completed', label: 'Completed' },
      ];

  return (
    <div>
      <PageHeader
        eyebrow={asTailor ? 'Orders from customers' : 'Tailoring'}
        title={asTailor ? 'Your' : 'Your tailor'}
        accent="bookings"
        actions={!asTailor && <ButtonLink to="/tailors">Find a tailor</ButtonLink>}
      />
      <Tabs tabs={tabs} value={filter} onChange={setFilter} className="mb-6" />
      {bookings.error && <ErrorNote message={bookings.error} onRetry={bookings.reload} />}
      {bookings.loading && !bookings.data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-24" />
          ))}
        </div>
      ) : bookings.data?.data.length === 0 ? (
        <EmptyState
          title={asTailor ? 'No bookings here' : 'No bookings yet'}
          description={asTailor ? 'New requests appear here (and in your notifications) as soon as a customer pays.' : 'Find a tailor near you, book a service and pay securely.'}
          action={!asTailor && <ButtonLink to="/tailors">Find a tailor</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {bookings.data?.data.map((booking, index) => (
            <motion.li key={booking.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Link to={`${base}/${booking.id}`} className="flex items-center gap-4 rounded-[20px] border border-hairline bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_20px_40px_-30px_rgba(43,41,38,0.6)]">
                {booking.tryOn?.resultUrl || booking.product ? (
                  <img src={booking.tryOn?.resultUrl ? booking.tryOn.resultUrl.replace('/upload/', '/upload/c_fill,w_120,h_160/') : imageUrl(booking.product!.images[0], 120)} alt="" className="h-16 w-12 shrink-0 rounded-lg bg-sand object-cover" />
                ) : (
                  <Avatar name={asTailor ? booking.customer.name : booking.tailor.businessName} size={48} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{booking.serviceName}</p>
                  <p className="truncate text-sm text-muted">
                    {asTailor ? booking.customer.name : booking.tailor.businessName} · {booking.code}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <CalendarDays size={12} /> {booking.handoff === 'home_visit' ? 'Home visit' : 'Drop-off'} {formatDateTime(booking.appointmentAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusPill tone={bookingTone(booking.status)} pulse={booking.status === 'requested' && asTailor}>
                    {BOOKING_STATUS_LABEL[booking.status]}
                  </StatusPill>
                  <p className="text-sm font-semibold">{formatPrice(booking.price)}</p>
                  <p className="text-[11px] text-stone">{timeAgo(booking.createdAt)}</p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
