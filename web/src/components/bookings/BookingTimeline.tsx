import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { BOOKING_STEPS, type Booking } from '../../types/bookings';
import { cn } from '../../utils/format';
import { formatDateTime } from '../../utils/time';

/**
 * Order tracking: the five steps from request to completion. Done steps show when they
 * happened (from the booking's events); the current step pulses.
 */
export function BookingTimeline({ booking }: { booking: Booking }) {
  const events = booking.events ?? [];
  const closed = booking.status === 'cancelled' || booking.status === 'declined';
  const currentIndex = BOOKING_STEPS.findIndex((step) => step.status === booking.status);
  const reached = (index: number) => (closed ? events.some((event) => event.status === BOOKING_STEPS[index].status) : index <= currentIndex);

  if (booking.status === 'pending_payment') {
    return <p className="text-sm text-muted">Tracking starts once the booking is paid.</p>;
  }

  return (
    <ol className="relative">
      {BOOKING_STEPS.map((step, index) => {
        const done = reached(index);
        const current = !closed && index === currentIndex;
        const event = events.find((item) => item.status === step.status);
        return (
          <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
            {index < BOOKING_STEPS.length - 1 && (
              <span className="absolute top-7 left-[13px] h-[calc(100%-1.75rem)] w-px bg-hairline">
                <motion.span
                  className="absolute inset-x-0 top-0 bg-olive"
                  initial={{ height: 0 }}
                  animate={{ height: reached(index + 1) ? '100%' : 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.12, type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'relative grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                done ? 'border-olive bg-olive text-paper' : 'border-hairline bg-card text-muted',
              )}
            >
              {current && <span className="absolute inset-0 animate-ping rounded-full bg-olive/40" />}
              {done && !current ? <Check size={14} strokeWidth={2.5} /> : index + 1}
            </motion.span>
            <div className="pt-0.5">
              <p className={cn('text-sm', done ? 'font-semibold' : 'text-muted')}>{step.label}</p>
              <p className="text-xs text-muted">{event ? formatDateTime(event.createdAt) : current ? step.hint : ''}</p>
              {event?.note && <p className="mt-1 text-xs text-ink/70 italic">“{event.note}”</p>}
            </div>
          </li>
        );
      })}
      {closed && (
        <li className="relative flex gap-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-henna text-paper">
            <X size={14} strokeWidth={2.5} />
          </span>
          <div className="pt-0.5">
            <p className="text-sm font-semibold text-henna">{booking.status === 'declined' ? 'Declined by the tailor' : 'Cancelled'}</p>
            {booking.closingReason && <p className="text-xs text-muted italic">“{booking.closingReason}”</p>}
          </div>
        </li>
      )}
    </ol>
  );
}
