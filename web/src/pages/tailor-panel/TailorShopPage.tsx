import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import {
  addGalleryPhoto,
  addService,
  deleteService,
  getOwnTailorProfile,
  removeGalleryPhoto,
  saveTailorProfile,
  updateService,
  type ServiceInput,
  type TailorProfileInput,
} from '../../api/tailors.api';
import { LocationField } from '../../components/map/LocationField';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Dropzone } from '../../components/ui/Dropzone';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import { ChipGroup, SelectField, TextAreaField, Toggle } from '../../components/ui/Fields';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { TextField } from '../../components/ui/TextField';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { SPECIALITY_LABEL, type ServiceType, type TailorService, type TailorSpeciality } from '../../types/tailors';
import { formatPrice, labelOf } from '../../utils/format';

const SERVICE_TYPES: ServiceType[] = ['stitching', 'alteration', 'embroidery', 'bridal'];
const emptyService: ServiceInput = { name: '', type: 'stitching', description: '', price: 2500, durationDays: 7 };

/** The tailor's shop editor: details and map pin, priced services, and a photo gallery. */
export function TailorShopPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const shop = useApi((signal) => getOwnTailorProfile(signal));
  const profile = shop.data?.profile ?? null;

  const [draft, setDraft] = useState<TailorProfileInput | null>(null);
  const form: TailorProfileInput = draft ?? {
    businessName: profile?.businessName ?? user?.name ?? '',
    bio: profile?.bio ?? '',
    phone: profile?.phone ?? user?.phone ?? '',
    address: profile?.address ?? '',
    city: profile?.city ?? user?.city ?? '',
    lat: profile?.lat,
    lng: profile?.lng,
    specialities: profile?.specialities ?? [],
    turnaroundDays: profile?.turnaroundDays ?? 7,
    homeVisits: profile?.homeVisits ?? false,
  };
  const update = (patch: Partial<TailorProfileInput>) => setDraft({ ...form, ...patch });

  const [service, setService] = useState<{ id?: string; input: ServiceInput } | null>(null);
  const [toDelete, setToDelete] = useState<TailorService | null>(null);

  const save = useAction(async () => {
    await saveTailorProfile({ ...form, bio: form.bio?.trim() || undefined });
    setDraft(null);
    shop.reload();
    toast({ title: 'Shop saved' });
  });
  const saveService = useAction(async () => {
    const input = { ...service!.input, description: service!.input.description?.trim() || undefined };
    if (service!.id) await updateService(service!.id, input);
    else await addService(input);
    setService(null);
    shop.reload();
  });
  const removeService = useAction(async () => {
    await deleteService(toDelete!.id);
    setToDelete(null);
    shop.reload();
  });
  const toggleService = useAction(async (item: TailorService) => {
    await updateService(item.id, { isActive: !item.isActive });
    shop.reload();
  });
  const upload = useAction(async (file: File) => {
    await addGalleryPhoto(file);
    shop.reload();
  });
  const removePhoto = useAction(async (index: number) => {
    await removeGalleryPhoto(index);
    shop.reload();
  });

  if (shop.loading) return <Skeleton className="h-[600px]" />;
  const canSave = form.businessName.trim().length >= 2 && form.address.trim().length >= 5 && form.city.trim().length >= 2 && /^(\+92|0)3\d{9}$/.test(form.phone.trim());

  return (
    <div>
      <PageHeader eyebrow="My shop" title="How customers" accent="see you" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel eyebrow="Details" title="Shop profile">
          <div className="space-y-4">
            <TextField label="Shop name" value={form.businessName} onChange={(event) => update({ businessName: event.target.value })} />
            <TextAreaField label="About your shop" value={form.bio ?? ''} maxLength={1000} onChange={(event) => update({ bio: event.target.value })} placeholder="Years of experience, what you are known for" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Shop phone" value={form.phone} onChange={(event) => update({ phone: event.target.value })} placeholder="03001234567" />
              <TextField label="Usual turnaround (days)" inputMode="numeric" value={String(form.turnaroundDays)} onChange={(event) => update({ turnaroundDays: Math.min(60, Number(event.target.value.replace(/\D/g, '')) || 1) })} />
            </div>
            <ChipGroup<TailorSpeciality>
              label="Specialities"
              multiple
              options={(Object.keys(SPECIALITY_LABEL) as TailorSpeciality[]).map((value) => ({ value, label: SPECIALITY_LABEL[value] }))}
              value={form.specialities}
              onChange={(specialities) => update({ specialities })}
            />
            <Toggle checked={form.homeVisits} onChange={(homeVisits) => update({ homeVisits })} label="I make home visits" description="Take measurements and collect fabric at the customer's home" />
          </div>
        </Panel>

        <Panel eyebrow="Location" title="Where to find you" delay={0.06}>
          <div className="space-y-4">
            <TextField label="Address" value={form.address} onChange={(event) => update({ address: event.target.value })} placeholder="Shop number, market, sector" />
            <TextField label="City" value={form.city} onChange={(event) => update({ city: event.target.value })} />
            <LocationField address={form.address} city={form.city} value={form.lat !== undefined && form.lng !== undefined ? { lat: form.lat, lng: form.lng } : null} onChange={(point) => update(point)} />
            <Button className="w-full" disabled={!canSave} loading={save.running} onClick={() => save.run()}>
              {profile ? 'Save changes' : 'Create my shop'}
            </Button>
          </div>
        </Panel>
      </div>

      {profile && (
        <>
          <Panel
            eyebrow="Prices"
            title="Services"
            className="mt-6"
            delay={0.1}
            actions={
              <Button size="sm" variant="ghost" onClick={() => setService({ input: emptyService })}>
                <Plus size={14} /> Add service
              </Button>
            }
          >
            {profile.services.length === 0 ? (
              <EmptyState title="No services yet" description="Customers can only book you once you list at least one priced service." className="py-6" />
            ) : (
              <ul className="divide-y divide-hairline/70">
                <AnimatePresence initial={false}>
                  {profile.services.map((item) => (
                    <motion.li key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className={item.isActive ? 'font-semibold' : 'font-semibold text-muted line-through'}>{item.name}</p>
                        <p className="text-sm text-muted">
                          {labelOf(item.type)} · {item.durationDays} days{item.description ? ` · ${item.description}` : ''}
                        </p>
                      </div>
                      <p className="font-logo text-xl italic">{formatPrice(item.price)}</p>
                      <button type="button" onClick={() => toggleService.run(item)} className="rounded-full border border-hairline px-3 py-1 text-xs hover:border-ink">
                        {item.isActive ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        type="button"
                        aria-label="Edit"
                        onClick={() => setService({ id: item.id, input: { name: item.name, type: item.type, description: item.description ?? '', price: item.price, durationDays: item.durationDays } })}
                        className="p-1.5 text-muted hover:text-ink"
                      >
                        <Pencil size={15} />
                      </button>
                      <button type="button" aria-label="Delete" onClick={() => setToDelete(item)} className="p-1.5 text-muted hover:text-henna">
                        <Trash2 size={15} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Panel>

          <Panel eyebrow="Gallery" title="Your work" className="mt-6" delay={0.14} actions={<span className="text-xs text-muted">{profile.gallery.length}/8 photos</span>}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.gallery.map((image, index) => (
                <div key={image.publicId} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-sand">
                  <img src={image.url.replace('/upload/', '/upload/c_fill,w_400,h_533/')} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => removePhoto.run(index)} className="absolute top-2 right-2 hidden h-7 w-7 place-items-center rounded-full bg-ink/80 text-paper group-hover:grid">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {profile.gallery.length < 8 && <Dropzone onFile={(file) => upload.run(file)} disabled={upload.running} label={upload.running ? 'Uploading…' : 'Add a photo'} hint="Finished pieces you are proud of" className="aspect-[3/4] [&>button]:h-full" />}
            </div>
          </Panel>
        </>
      )}

      <Modal
        open={Boolean(service)}
        onClose={() => setService(null)}
        title={service?.id ? 'Edit service' : 'New service'}
        footer={
          <Button size="sm" loading={saveService.running} disabled={!service || service.input.name.trim().length < 2 || service.input.price < 200} onClick={() => saveService.run()}>
            Save service
          </Button>
        }
      >
        {service && (
          <div className="space-y-4">
            <TextField label="Name" value={service.input.name} placeholder="e.g. Shalwar kameez stitching" onChange={(event) => setService({ ...service, input: { ...service.input, name: event.target.value } })} />
            <SelectField label="Type" options={SERVICE_TYPES.map((value) => ({ value, label: labelOf(value) }))} value={service.input.type} onChange={(event) => setService({ ...service, input: { ...service.input, type: event.target.value as ServiceType } })} />
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Price (Rs)" inputMode="numeric" value={String(service.input.price)} hint="At least Rs 200" onChange={(event) => setService({ ...service, input: { ...service.input, price: Number(event.target.value.replace(/\D/g, '')) || 0 } })} />
              <TextField label="Days to finish" inputMode="numeric" value={String(service.input.durationDays)} onChange={(event) => setService({ ...service, input: { ...service.input, durationDays: Math.max(1, Math.min(90, Number(event.target.value.replace(/\D/g, '')) || 1)) } })} />
            </div>
            <TextAreaField label="Description" value={service.input.description ?? ''} maxLength={300} onChange={(event) => setService({ ...service, input: { ...service.input, description: event.target.value } })} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={() => removeService.run()} loading={removeService.running} title={`Delete “${toDelete?.name}”?`} confirmLabel="Delete" danger />
    </div>
  );
}
