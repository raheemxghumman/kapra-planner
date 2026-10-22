import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addStore, deleteStore, getOwnBrand, updateOwnBrand, updateStore, uploadBrandLogo, type StoreInput } from '../../api/panels.api';
import { LocationField } from '../../components/map/LocationField';
import { MapView } from '../../components/map/MapView';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Dropzone } from '../../components/ui/Dropzone';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { TextAreaField } from '../../components/ui/Fields';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { TextField } from '../../components/ui/TextField';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import type { BrandStore } from '../../types/panels';

/** Brand profile (description, website, logo) and store locations shown on the Kapra map. */
export function BrandStoresPage() {
  const { toast } = useToast();
  const own = useApi((signal) => getOwnBrand(signal));
  const brand = own.data?.brand;
  const [profile, setProfile] = useState<{ description: string; website: string } | null>(null);
  const shown = profile ?? { description: brand?.description ?? '', website: brand?.website ?? '' };
  const [store, setStore] = useState<{ id?: string; input: StoreInput } | null>(null);
  const [toDelete, setToDelete] = useState<BrandStore | null>(null);

  const saveProfile = useAction(async () => {
    await updateOwnBrand({ description: shown.description.trim() || undefined, website: shown.website.trim() || undefined });
    setProfile(null);
    own.reload();
    toast({ title: 'Brand profile saved' });
  });
  const logo = useAction(async (file: File) => {
    await uploadBrandLogo(file);
    own.reload();
  });
  const saveStore = useAction(async () => {
    if (store!.id) await updateStore(store!.id, store!.input);
    else await addStore(store!.input);
    setStore(null);
    own.reload();
    toast({ title: 'Store saved', description: 'It now shows on the Kapra map.' });
  });
  const removeStore = useAction(async () => {
    await deleteStore(toDelete!.id);
    setToDelete(null);
    own.reload();
  });

  if (own.loading) return <Skeleton className="h-96" />;
  if (own.error) return <ErrorNote message={own.error} />;
  if (!brand) return <EmptyState title="Not linked yet" description="An admin links your account to your brand after verification." />;

  return (
    <div>
      <PageHeader eyebrow="Brand" title={brand.name} accent="& stores" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel eyebrow="Profile" title="About the brand">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="h-20 w-20 rounded-2xl border border-hairline bg-paper object-contain p-2" />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-ink font-logo text-3xl text-paper italic">{brand.name[0]}</span>
              )}
              <Dropzone onFile={(file) => logo.run(file)} disabled={logo.running} label={logo.running ? 'Uploading…' : 'Upload logo'} hint="Square works best" className="flex-1 [&>button]:py-5" />
            </div>
            <TextAreaField label="Description" value={shown.description} maxLength={1000} onChange={(event) => setProfile({ ...shown, description: event.target.value })} />
            <TextField label="Website" value={shown.website} placeholder="https://" onChange={(event) => setProfile({ ...shown, website: event.target.value })} />
            <Button onClick={() => saveProfile.run()} loading={saveProfile.running}>
              Save profile
            </Button>
          </div>
        </Panel>

        <Panel
          eyebrow="Map"
          title="Store locations"
          delay={0.06}
          actions={
            <Button size="sm" variant="ghost" onClick={() => setStore({ input: { name: '', address: '', city: '' } })}>
              <Plus size={14} /> Add store
            </Button>
          }
        >
          <div className="h-64 overflow-hidden rounded-2xl border border-hairline">
            <MapView markers={brand.stores.map((item) => ({ id: item.id, lat: item.lat, lng: item.lng, kind: 'store', title: item.name }))} fit={brand.stores.length > 1} center={brand.stores[0] ?? undefined} zoom={brand.stores.length ? 13 : 6} />
          </div>
          <ul className="mt-4 divide-y divide-hairline/70">
            {brand.stores.length === 0 && <li className="py-4 text-sm text-muted">No stores yet. Add your shops so customers can find them on the map.</li>}
            {brand.stores.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <MapPin size={16} className="text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-muted">
                    {item.address}, {item.city}
                  </p>
                </div>
                <button type="button" aria-label="Edit" onClick={() => setStore({ id: item.id, input: { name: item.name, address: item.address, city: item.city, lat: item.lat, lng: item.lng } })} className="p-1.5 text-muted hover:text-ink">
                  <Pencil size={14} />
                </button>
                <button type="button" aria-label="Delete" onClick={() => setToDelete(item)} className="p-1.5 text-muted hover:text-henna">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Modal
        open={Boolean(store)}
        onClose={() => setStore(null)}
        title={store?.id ? 'Edit store' : 'New store'}
        className="max-w-xl"
        footer={
          <Button size="sm" loading={saveStore.running} disabled={!store || store.input.name.trim().length < 2 || store.input.address.trim().length < 5 || store.input.city.trim().length < 2} onClick={() => saveStore.run()}>
            Save store
          </Button>
        }
      >
        {store && (
          <div className="space-y-4">
            <TextField label="Store name" value={store.input.name} placeholder="e.g. Limelight F-7" onChange={(event) => setStore({ ...store, input: { ...store.input, name: event.target.value } })} />
            <TextField label="Address" value={store.input.address} onChange={(event) => setStore({ ...store, input: { ...store.input, address: event.target.value } })} />
            <TextField label="City" value={store.input.city} onChange={(event) => setStore({ ...store, input: { ...store.input, city: event.target.value } })} />
            <LocationField
              address={store.input.address}
              city={store.input.city}
              value={store.input.lat !== undefined && store.input.lng !== undefined ? { lat: store.input.lat, lng: store.input.lng } : null}
              onChange={(point) => setStore({ ...store, input: { ...store.input, ...point } })}
            />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={() => removeStore.run()} loading={removeStore.running} title={`Delete “${toDelete?.name}”?`} confirmLabel="Delete" danger />
    </div>
  );
}
