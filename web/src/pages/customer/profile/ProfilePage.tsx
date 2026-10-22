import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { createMeasurement, deleteMeasurement, getStyleProfile, listMeasurements, updateMe, updateMeasurement, updateStyleProfile } from '../../../api/customer.api';
import { ColourPicker } from '../../../components/catalogue/ColourPicker';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState, Skeleton } from '../../../components/ui/Feedback';
import { ChipGroup, SelectField } from '../../../components/ui/Fields';
import { Modal } from '../../../components/ui/Modal';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Panel } from '../../../components/ui/Panel';
import { TextField } from '../../../components/ui/TextField';
import { useAction } from '../../../hooks/useAction';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import type { Gender, WearStyle } from '../../../types/catalogue';
import { MEASUREMENT_FIELDS, type Measurement, type StyleProfile } from '../../../types/profile';
import { formatPrice } from '../../../utils/format';
import { MeasurementForm } from './MeasurementForm';

const TOP_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const sizeOptions = (sizes: string[]) => sizes.map((size) => ({ value: size, label: size }));

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const profile = useApi((signal) => getStyleProfile(signal));
  const measurements = useApi((signal) => listMeasurements(signal));

  const [account, setAccount] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', city: user?.city ?? '' });
  // Unsaved edits; until the first edit we show what the server returned.
  const [draft, setStyle] = useState<StyleProfile | null>(null);
  const style = draft ?? profile.data ?? null;
  const [editing, setEditing] = useState<Measurement | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Measurement | null>(null);

  const saveAccount = useAction(async () => {
    updateUser(await updateMe({ name: account.name.trim(), phone: account.phone.trim() || undefined, city: account.city.trim() || undefined }));
    toast({ title: 'Account updated' });
  });
  const saveStyle = useAction(async () => {
    const { id: _id, ...input } = style!;
    setStyle(await updateStyleProfile(input));
    toast({ title: 'Style profile saved', description: 'The stylist will use it from now on.' });
  });
  const saveMeasurement = useAction(async (input: Parameters<typeof createMeasurement>[0]) => {
    if (editing === 'new') await createMeasurement(input);
    else if (editing) await updateMeasurement(editing.id, input);
    setEditing(null);
    measurements.reload();
    toast({ title: 'Measurements saved' });
  });
  const removeMeasurement = useAction(async () => {
    await deleteMeasurement(toDelete!.id);
    setToDelete(null);
    measurements.reload();
  });

  return (
    <div>
      <PageHeader eyebrow="Profile" title="Sizes &" accent="taste" description="Your stylist and tailors work from this page." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Panel eyebrow="Account" title="Your details">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveAccount.run();
            }}
            className="space-y-4"
          >
            <TextField label="Name" value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
            <TextField label="Email" value={user?.email ?? ''} disabled hint="Email cannot be changed" />
            <TextField label="Mobile" placeholder="03001234567" value={account.phone} onChange={(event) => setAccount({ ...account, phone: event.target.value })} />
            <TextField label="City" value={account.city} onChange={(event) => setAccount({ ...account, city: event.target.value })} />
            <Button type="submit" loading={saveAccount.running}>
              Save details
            </Button>
          </form>
        </Panel>

        <Panel eyebrow="For the stylist" title="Style profile" delay={0.08}>
          {!style ? (
            <Skeleton className="h-80" />
          ) : (
            <div className="space-y-6">
              <ChipGroup<Gender>
                label="I shop for"
                options={[
                  { value: 'women', label: 'Women' },
                  { value: 'men', label: 'Men' },
                ]}
                value={[style.gender]}
                onChange={([gender]) => setStyle({ ...style, gender })}
              />
              <ChipGroup<WearStyle>
                label="I wear"
                multiple
                options={[
                  { value: 'eastern', label: 'Eastern' },
                  { value: 'western', label: 'Western' },
                ]}
                value={style.styles}
                onChange={(styles) => styles.length && setStyle({ ...style, styles })}
              />
              <div className="grid grid-cols-3 gap-3">
                <SelectField label="Top" placeholder="—" options={sizeOptions(TOP_SIZES)} value={style.sizes.top ?? ''} onChange={(event) => setStyle({ ...style, sizes: { ...style.sizes, top: event.target.value || undefined } })} />
                <SelectField label="Bottom" placeholder="—" options={sizeOptions(TOP_SIZES)} value={style.sizes.bottom ?? ''} onChange={(event) => setStyle({ ...style, sizes: { ...style.sizes, bottom: event.target.value || undefined } })} />
                <SelectField label="Shoes" placeholder="—" options={sizeOptions(SHOE_SIZES)} value={style.sizes.shoes ?? ''} onChange={(event) => setStyle({ ...style, sizes: { ...style.sizes, shoes: event.target.value || undefined } })} />
              </div>
              <ColourPicker label="Colours I love" value={style.favouriteColours} onChange={(favouriteColours) => setStyle({ ...style, favouriteColours })} exclude={style.avoidColours} />
              <ColourPicker label="Colours I avoid" value={style.avoidColours} onChange={(avoidColours) => setStyle({ ...style, avoidColours })} exclude={style.favouriteColours} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Usual budget from" inputMode="numeric" value={String(style.budgetMin)} onChange={(event) => setStyle({ ...style, budgetMin: Number(event.target.value.replace(/\D/g, '')) || 0 })} hint={formatPrice(style.budgetMin)} />
                <TextField label="Up to" inputMode="numeric" value={String(style.budgetMax)} onChange={(event) => setStyle({ ...style, budgetMax: Number(event.target.value.replace(/\D/g, '')) || 0 })} hint={formatPrice(style.budgetMax)} />
              </div>
              <Button onClick={() => saveStyle.run()} loading={saveStyle.running}>
                Save style profile
              </Button>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        eyebrow="For tailors"
        title="Measurements"
        className="mt-6"
        delay={0.12}
        actions={
          (measurements.data?.length ?? 0) < 10 && (
            <Button size="sm" variant="ghost" onClick={() => setEditing('new')}>
              <Plus size={14} /> Add
            </Button>
          )
        }
      >
        {measurements.loading ? (
          <Skeleton className="h-32" />
        ) : measurements.data?.length === 0 ? (
          <EmptyState title="No measurements yet" description="Save measurements for yourself or family members; you pick one when booking a tailor." action={<Button size="sm" onClick={() => setEditing('new')}>Add measurements</Button>} className="py-8" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {measurements.data?.map((measurement, index) => (
              <motion.div key={measurement.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-hairline bg-paper/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-semibold">
                    <Ruler size={15} className="text-muted" /> {measurement.label}
                  </p>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Edit" onClick={() => setEditing(measurement)} className="rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-ink">
                      <Pencil size={14} />
                    </button>
                    <button type="button" aria-label="Delete" onClick={() => setToDelete(measurement)} className="rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-henna">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-4 gap-x-3 gap-y-2">
                  {MEASUREMENT_FIELDS.map(([key, label]) => (
                    <div key={key}>
                      <dt className="text-[10px] tracking-wide text-muted uppercase">{label}</dt>
                      <dd className="text-sm">{measurement[key] ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            ))}
          </div>
        )}
      </Panel>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New measurements' : 'Edit measurements'} description="All values in inches." className="max-w-2xl">
        {editing !== null && <MeasurementForm initial={editing === 'new' ? undefined : editing} onSubmit={(input) => saveMeasurement.run(input)} saving={saveMeasurement.running} />}
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={() => removeMeasurement.run()} loading={removeMeasurement.running} title={`Delete “${toDelete?.label}”?`} confirmLabel="Delete" danger />
    </div>
  );
}
