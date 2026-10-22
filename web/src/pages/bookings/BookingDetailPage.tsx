import { CalendarDays, CreditCard, Home, MapPin, Phone, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { bookingAction, confirmPayment, getBooking, payBooking, reviewBooking } from '../../api/bookings.api';
import { BookingTimeline } from '../../components/bookings/BookingTimeline';
import { ChatPanel } from '../../components/bookings/ChatPanel';
import { OutfitBoard } from '../../components/outfit/OutfitBoard';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Stars, StarInput } from '../../components/ui/Display';
import { ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { TextAreaField } from '../../components/ui/Fields';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { useToast } from '../../hooks/useToast';
import { BOOKING_STATUS_LABEL, type BookingAction } from '../../types/bookings';
import { MEASUREMENT_FIELDS } from '../../types/profile';
import { formatPrice, imageUrl } from '../../utils/format';
import { bookingTone, PAYMENT_LABEL } from '../../utils/status';
import { formatDate, formatDateTime } from '../../utils/time';

const ACTION_COPY: Record<BookingAction, { label: string; done: string; confirm?: string; danger?: boolean; reason?: boolean }> = {
  accept: { label: 'Accept booking', done: 'Booking accepted' },
  decline: { label: 'Decline', done: 'Booking declined and refunded', confirm: 'Decline this booking?', danger: true, reason: true },
  start: { label: 'Start stitching', done: 'Marked as stitching' },
  ready: { label: 'Mark ready for pickup', done: 'Marked ready; the customer has been told' },
  complete: { label: 'Mark completed', done: 'Booking completed' },
  cancel: { label: 'Cancel booking', done: 'Booking cancelled', confirm: 'Cancel this booking?', danger: true },
};

/**
 * One booking, for both sides. The customer sees the tailor's details, pays, tracks progress,
 * chats and reviews; the tailor sees the customer, measurements and the look to stitch, and
 * moves the booking forward. Buttons come from the server ("actions"), never guessed here.
 */
export function BookingDetailPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const booking = useApi((signal) => getBooking(id, signal), [id]);
  const [confirming, setConfirming] = useState<BookingAction | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const confirmedSession = useRef<string | null>(null);

  useRealtimeEvent<{ id: string }>('booking.updated', (event) => event.id === id && booking.reload());

  // Back from Stripe: ask the server to check the payment with Stripe, then refresh.
  const sessionId = params.get('session_id');
  const reloadBooking = booking.reload;
  useEffect(() => {
    if (!sessionId || confirmedSession.current === sessionId) return;
    confirmedSession.current = sessionId;
    confirmPayment(sessionId)
      .then((payment) => {
        if (payment.status === 'paid') toast({ title: 'Payment received', description: 'The tailor has your request.' });
        reloadBooking();
      })
      .catch(() => toast({ title: 'We could not confirm the payment yet', tone: 'error' }))
      .finally(() => setParams({}, { replace: true }));
  }, [sessionId, toast, reloadBooking, setParams]);
  const cancelledPayment = params.get('payment') === 'cancelled';

  const act = useAction(async (action: BookingAction, reason?: string) => {
    await bookingAction(id, action, reason);
    setConfirming(null);
    booking.reload();
    toast({ title: ACTION_COPY[action].done });
  });
  const pay = useAction(async () => {
    const { checkoutUrl } = await payBooking(id);
    window.location.assign(checkoutUrl);
  });
  const review = useAction(async () => {
    await reviewBooking(id, rating, comment.trim());
    toast({ title: 'Thank you for the review' });
    booking.reload();
  });

  if (booking.loading && !booking.data) return <Skeleton className="h-[600px]" />;
  if (booking.error || !booking.data) return <ErrorNote message={booking.error ?? 'Booking not found'} />;

  const item = booking.data;
  const asTailor = item.viewerRole === 'tailor';
  const otherName = asTailor ? item.customer.name : item.tailor.businessName;
  const chatOpen = !['pending_payment', 'cancelled', 'declined'].includes(item.status) && item.viewerRole !== 'admin';
  const backTo = asTailor ? '/tailor/bookings' : item.viewerRole === 'admin' ? '/admin' : '/app/bookings';

  return (
    <div>
      <Link to={backTo} className="eyebrow text-muted hover:text-ink">
        ← Bookings
      </Link>
      <header className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={bookingTone(item.status)} pulse={item.status === 'in_progress'}>
              {BOOKING_STATUS_LABEL[item.status]}
            </StatusPill>
            <span className="font-mono text-xs text-muted">{item.code}</span>
          </div>
          <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.8rem)] leading-tight tracking-[-0.02em]">
            {item.serviceName} <span className="font-logo italic">with {asTailor ? item.customer.name.split(' ')[0] : item.tailor.businessName}</span>
          </h1>
          <p className="mt-1 text-muted">
            {formatPrice(item.price)}
            {item.payment && ` · ${PAYMENT_LABEL[item.payment.status]}`}
            {item.dueDate && ` · due ${formatDate(item.dueDate)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.status === 'pending_payment' && item.viewerRole === 'customer' && (
            <Button onClick={() => pay.run()} loading={pay.running}>
              <CreditCard size={15} /> Pay {formatPrice(item.price)}
            </Button>
          )}
          {item.actions.map((action) => {
            const copy = ACTION_COPY[action];
            const label = action === 'complete' && !asTailor ? 'I received it' : copy.label;
            return (
              <Button
                key={action}
                variant={copy.danger ? 'ghost' : 'primary'}
                loading={act.running && !copy.confirm}
                onClick={() => (copy.confirm ? setConfirming(action) : act.run(action))}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </header>

      {cancelledPayment && item.status === 'pending_payment' && (
        <div className="mt-6 rounded-2xl border border-hairline bg-card px-5 py-4 text-sm">Payment was cancelled. Your booking is saved; pay whenever you are ready.</div>
      )}
      {item.payment?.status === 'refund_pending' && (
        <div className="mt-6 rounded-2xl bg-blush/40 px-5 py-4 text-sm text-henna">Your refund of {formatPrice(item.payment.amount)} is being processed by Stripe.</div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Panel eyebrow="Tracking" title="Where it is now">
            <BookingTimeline booking={item} />
          </Panel>

          <Panel eyebrow="Details" title="The booking" delay={0.06}>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail icon={CalendarDays} label={item.handoff === 'home_visit' ? 'Home visit' : 'Drop-off'} value={formatDateTime(item.appointmentAt)} />
              {item.handoff === 'home_visit' ? (
                <Detail icon={Home} label="Visit address" value={item.address ?? '—'} />
              ) : (
                <Detail icon={Store} label="Shop" value={`${item.tailor.address}, ${item.tailor.city}`} />
              )}
              <Detail icon={Phone} label={asTailor ? 'Customer' : 'Tailor'} value={asTailor ? `${item.customer.name}${item.customer.phone ? ` · ${item.customer.phone}` : ''}` : item.tailor.phone} />
              {!asTailor && (
                <Detail icon={MapPin} label="Map" value={<a className="underline underline-offset-4" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${item.tailor.lat}&mlon=${item.tailor.lng}#map=17/${item.tailor.lat}/${item.tailor.lng}`}>Open directions</a>} />
              )}
            </dl>
            {item.notes && <p className="mt-5 rounded-xl bg-paper/70 px-4 py-3 text-sm italic">“{item.notes}”</p>}
          </Panel>

          {(item.tryOn?.resultUrl || item.product || item.outfit) && (
            <Panel eyebrow="To stitch" title="The look" delay={0.1}>
              <div className="grid gap-4 sm:grid-cols-2">
                {item.tryOn?.resultUrl && (
                  <figure>
                    <img src={item.tryOn.resultUrl} alt="Try-on" className="aspect-[3/4] w-full rounded-2xl object-cover" />
                    <figcaption className="mt-2 text-xs text-muted">Virtual try-on</figcaption>
                  </figure>
                )}
                {item.product && (
                  <Link to={`/shop/${item.product.id}`}>
                    <img src={imageUrl(item.product.images[0], 600)} alt="" className="aspect-[3/4] w-full rounded-2xl bg-sand object-cover" />
                    <p className="mt-2 text-sm">{item.product.title}</p>
                    <p className="text-xs text-muted">{item.product.brand?.name}</p>
                  </Link>
                )}
                {item.outfit && item.outfit.items.length > 0 && (
                  <div className="sm:col-span-2">
                    <OutfitBoard items={item.outfit.items} compact />
                    <p className="mt-2 text-sm">{item.outfit.name}</p>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {item.measurements && (
            <Panel eyebrow="Measurements" title={item.measurements.label} delay={0.12}>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {MEASUREMENT_FIELDS.map(([key, label]) => (
                  <div key={key}>
                    <dt className="text-[10px] tracking-wide text-muted uppercase">{label}</dt>
                    <dd className="text-lg">{item.measurements!.values[key] ?? '—'}<span className="text-xs text-muted">{item.measurements!.values[key] ? ' in' : ''}</span></dd>
                  </div>
                ))}
              </dl>
              {item.measurements.notes && <p className="mt-4 text-sm text-muted italic">{item.measurements.notes}</p>}
            </Panel>
          )}

          {item.status === 'completed' && item.viewerRole === 'customer' && (
            <Panel eyebrow="Review" title={item.review ? 'Your review' : `How was ${item.tailor.businessName}?`} delay={0.14}>
              {item.review ? (
                <div>
                  <Stars value={item.review.rating} size={18} />
                  {item.review.comment && <p className="mt-2 text-sm">{item.review.comment}</p>}
                  {item.review.reply && <p className="mt-3 rounded-xl bg-paper/70 px-4 py-3 text-sm"><span className="font-semibold">Tailor’s reply:</span> {item.review.reply}</p>}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <StarInput value={rating} onChange={setRating} />
                  <TextAreaField label="What went well, or not?" value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} hint="English, Urdu or Roman Urdu are all fine. Your words help rank tailors." />
                  <Button disabled={!rating} loading={review.running} onClick={() => review.run()}>
                    Post review
                  </Button>
                </motion.div>
              )}
            </Panel>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ChatPanel bookingId={item.id} otherName={otherName} open={chatOpen} />
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          open
          onClose={() => setConfirming(null)}
          onConfirm={(reason) => act.run(confirming, reason)}
          loading={act.running}
          title={ACTION_COPY[confirming].confirm!}
          description={item.payment?.status === 'paid' ? `${formatPrice(item.price)} will be refunded to the customer's card.` : undefined}
          confirmLabel={ACTION_COPY[confirming].label}
          danger={ACTION_COPY[confirming].danger}
          askReason={ACTION_COPY[confirming].reason ? { label: 'Reason (shown to the customer)', required: true } : undefined}
        />
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper">
        <Icon size={15} className="text-muted" />
      </span>
      <div>
        <dt className="eyebrow text-muted">{label}</dt>
        <dd className="mt-0.5 text-sm">{value}</dd>
      </div>
    </div>
  );
}
