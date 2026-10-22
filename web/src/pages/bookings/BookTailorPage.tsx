import { CreditCard, Home, Lock, Plus, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { createBooking } from '../../api/bookings.api';
import { createMeasurement, listMeasurements, listTryOns } from '../../api/customer.api';
import { getTailor } from '../../api/tailors.api';
import { Button } from '../../components/ui/Button';
import { ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { TextAreaField } from '../../components/ui/Fields';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import type { Handoff } from '../../types/bookings';
import { cn, formatPrice } from '../../utils/format';
import { MeasurementForm } from '../customer/profile/MeasurementForm';

const HOURS = [10, 11, 12, 14, 15, 16, 17, 18];

/** The next 14 days, starting tomorrow (the server refuses earlier dates). */
function nextDays(): Date[] {
  return Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + index + 1);
    return day;
  });
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: number * 0.05 }} className="rounded-[22px] border border-hairline bg-card p-6">
      <h2 className="flex items-center gap-3 text-lg">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink font-logo text-sm text-paper italic">{number}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

export function BookTailorPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const tailor = useApi((signal) => getTailor(slug, signal), [slug]);
  const measurements = useApi((signal) => listMeasurements(signal));
  const tryOns = useApi((signal) => listTryOns(signal));

  const [serviceId, setServiceId] = useState(params.get('service') ?? '');
  const [handoff, setHandoff] = useState<Handoff>('drop_off');
  const [address, setAddress] = useState('');
  const [day, setDay] = useState<Date | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [measurementId, setMeasurementId] = useState<string | null>(null);
  const [tryOnId, setTryOnId] = useState<string | null>(params.get('tryOn'));
  const [notes, setNotes] = useState('');
  const [addingMeasurement, setAddingMeasurement] = useState(false);

  const addMeasurement = useAction(async (input: Parameters<typeof createMeasurement>[0]) => {
    const created = await createMeasurement(input);
    setMeasurementId(created.id);
    setAddingMeasurement(false);
    measurements.reload();
  });
  const book = useAction(async () => {
    const appointment = new Date(day!);
    appointment.setHours(hour!, 0, 0, 0);
    const { checkoutUrl } = await createBooking({
      tailorId: tailor.data!.id,
      serviceId,
      handoff,
      appointmentAt: appointment.toISOString(),
      address: handoff === 'home_visit' ? address.trim() : undefined,
      measurementId: measurementId ?? undefined,
      tryOnId: tryOnId ?? undefined,
      outfitId: params.get('outfit') ?? undefined,
      productId: params.get('product') ?? undefined,
      notes: notes.trim() || undefined,
    });
    // Stripe's hosted page takes the card; it sends the customer back to the booking page.
    window.location.assign(checkoutUrl);
  });

  if (tailor.loading) return <Skeleton className="h-[600px]" />;
  if (tailor.error || !tailor.data) return <ErrorNote message={tailor.error ?? 'Tailor not found'} />;

  const t = tailor.data;
  const service = t.services.find((item) => item.id === serviceId);
  const doneTryOns = (tryOns.data ?? []).filter((item) => item.status === 'completed' && item.resultUrl);
  const ready = Boolean(service && day && hour !== null && (handoff === 'drop_off' || address.trim().length >= 5));

  return (
    <div>
      <Link to={`/tailors/${t.slug}`} className="eyebrow text-muted hover:text-ink">
        ← {t.businessName}
      </Link>
      <h1 className="mt-3 text-[clamp(2rem,4vw,3.2rem)] leading-tight tracking-[-0.02em]">
        Book <span className="font-logo italic">{t.businessName}</span>
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Step number={1} title="What do you need?">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {t.services.map((item) => (
                <button key={item.id} type="button" onClick={() => setServiceId(item.id)} className={cn('rounded-2xl border p-4 text-left transition-all', item.id === serviceId ? 'border-ink bg-paper shadow-[inset_0_0_0_1px_var(--color-ink)]' : 'border-hairline hover:border-ink/50')}>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatPrice(item.price)} · {item.durationDays} days
                  </p>
                </button>
              ))}
            </div>
          </Step>

          <Step number={2} title="How should the fabric reach the tailor?">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Choice active={handoff === 'drop_off'} onClick={() => setHandoff('drop_off')} icon={<Store size={18} />} title="I’ll drop it off" note={`${t.address}, ${t.city}`} />
              <Choice active={handoff === 'home_visit'} disabled={!t.homeVisits} onClick={() => setHandoff('home_visit')} icon={<Home size={18} />} title="Home visit" note={t.homeVisits ? 'Measured and collected at home' : 'Not offered by this tailor'} />
            </div>
            {handoff === 'home_visit' && <TextField className="mt-4" label="Your address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="House, street, sector, city" />}
          </Step>

          <Step number={3} title="When?">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {nextDays().map((date) => {
                const active = day?.toDateString() === date.toDateString();
                return (
                  <button key={date.toISOString()} type="button" onClick={() => setDay(date)} className={cn('flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition-colors', active ? 'border-ink bg-ink text-paper' : 'border-hairline hover:border-ink')}>
                    <span className="text-[10px] tracking-wider uppercase opacity-70">{date.toLocaleDateString('en-PK', { weekday: 'short' })}</span>
                    <span className="font-logo text-2xl italic">{date.getDate()}</span>
                    <span className="text-[10px] opacity-70">{date.toLocaleDateString('en-PK', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {HOURS.map((value) => (
                <button key={value} type="button" disabled={!day} onClick={() => setHour(value)} className={cn('rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-40', value === hour ? 'border-ink bg-ink text-paper' : 'border-hairline hover:border-ink')}>
                  {value > 12 ? `${value - 12}:00 pm` : `${value}:00 ${value === 12 ? 'pm' : 'am'}`}
                </button>
              ))}
            </div>
          </Step>

          <Step number={4} title="Measurements">
            <div className="flex flex-wrap gap-2">
              {measurements.data?.map((measurement) => (
                <button key={measurement.id} type="button" onClick={() => setMeasurementId(measurement.id === measurementId ? null : measurement.id)} className={cn('rounded-full border px-4 py-2 text-sm', measurement.id === measurementId ? 'border-ink bg-ink text-paper' : 'border-hairline hover:border-ink')}>
                  {measurement.label}
                </button>
              ))}
              <button type="button" onClick={() => setAddingMeasurement(true)} className="flex items-center gap-1 rounded-full border border-dashed border-stone px-4 py-2 text-sm hover:border-ink">
                <Plus size={14} /> New
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">Optional: the tailor can also measure you at drop-off or during the visit.</p>
          </Step>

          <Step number={5} title="The look and notes">
            {doneTryOns.length > 0 && (
              <div className="no-scrollbar mb-4 flex gap-3 overflow-x-auto pb-1">
                {doneTryOns.map((item) => (
                  <button key={item.id} type="button" onClick={() => setTryOnId(item.id === tryOnId ? null : item.id)} className={cn('h-28 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all', item.id === tryOnId ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100')}>
                    <img src={item.resultUrl!.replace('/upload/', '/upload/c_fill,w_160,h_224/')} alt="Try-on" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {params.get('outfit') && <p className="mb-3 text-sm text-olive">Your saved outfit is attached to this booking.</p>}
            <TextAreaField label="Notes for the tailor" value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder="Neckline, sleeve length, lining, anything else" />
          </Step>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-[24px] border border-hairline bg-ink text-paper">
            <div className="p-6">
              <p className="eyebrow text-paper/60">Summary</p>
              <p className="mt-2 font-logo text-2xl italic">{service?.name ?? 'Choose a service'}</p>
              <dl className="mt-5 space-y-2 text-sm">
                <Row label="Tailor" value={t.businessName} />
                <Row label="Handoff" value={handoff === 'home_visit' ? 'Home visit' : 'Drop-off'} />
                <Row label="When" value={day && hour !== null ? `${day.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}, ${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'pm' : 'am'}` : '—'} />
                <Row label="Ready in" value={service ? `about ${service.durationDays} days` : '—'} />
              </dl>
            </div>
            <div className="border-t border-paper/15 p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-paper/70">Total</span>
                <span className="font-logo text-4xl italic">{service ? formatPrice(service.price) : '—'}</span>
              </div>
              <Button variant="soft" size="lg" className="mt-5 w-full" disabled={!ready} loading={book.running} onClick={() => book.run()}>
                <CreditCard size={16} /> Pay with card
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-paper/60">
                <Lock size={11} /> Secure payment by Stripe (test mode). Full refund if the tailor declines.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <Modal open={addingMeasurement} onClose={() => setAddingMeasurement(false)} title="New measurements" description="All values in inches." className="max-w-2xl">
        <MeasurementForm onSubmit={(input) => addMeasurement.run(input)} saving={addMeasurement.running} />
      </Modal>
    </div>
  );
}

function Choice({ active, disabled, onClick, icon, title, note }: { active: boolean; disabled?: boolean; onClick: () => void; icon: ReactNode; title: string; note: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cn('flex gap-3 rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45', active ? 'border-ink bg-paper shadow-[inset_0_0_0_1px_var(--color-ink)]' : 'border-hairline hover:border-ink/50')}>
      <span className="mt-0.5 text-muted">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{note}</span>
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-paper/60">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
