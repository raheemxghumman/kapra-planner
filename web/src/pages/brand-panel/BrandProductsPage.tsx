import { Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import {
  addBrandProductImage,
  createBrandProduct,
  deleteBrandProduct,
  listBrandProducts,
  setProductHidden,
  setVariantStock,
  type NewProductInput,
} from '../../api/panels.api';
import { ColourPicker } from '../../components/catalogue/ColourPicker';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { ChipGroup, SelectField, TextAreaField } from '../../components/ui/Fields';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { TextField } from '../../components/ui/TextField';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import type { Gender, Occasion, ProductCategory, WearStyle } from '../../types/catalogue';
import type { BrandProduct } from '../../types/panels';
import { cn, formatPrice, imageUrl, labelOf } from '../../utils/format';

const CATEGORIES: ProductCategory[] = ['kurta', 'top', 'trousers', 'suit', 'dress', 'unstitched', 'dupatta', 'shawl', 'outerwear', 'shoes', 'bag', 'jewellery', 'accessory'];
const OCCASIONS: Occasion[] = ['casual', 'office', 'festive', 'formal', 'wedding', 'party'];
const blank: NewProductInput = { title: '', category: 'kurta', gender: 'women', style: 'eastern', colours: [], occasions: [], price: 3000, sizes: [{ size: 'S', stockQty: 5 }, { size: 'M', stockQty: 5 }, { size: 'L', stockQty: 5 }] };

/** The brand's catalogue: search, hide or show pieces, set stock per size, list new pieces. */
export function BrandProductsPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(q);
  const products = useApi((signal) => listBrandProducts({ q: search || undefined, page, limit: 20 }, signal), [search, page]);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState<NewProductInput | null>(null);
  const [created, setCreated] = useState<BrandProduct | null>(null);

  const toggle = useAction(async (product: BrandProduct) => {
    await setProductHidden(product.id, !product.hiddenByBrand);
    products.reload();
  });
  const stock = useAction(async (variantId: string, inStock: boolean, qty: number | null) => {
    await setVariantStock(variantId, inStock, qty);
    products.reload();
  });
  const create = useAction(async () => {
    setCreated(await createBrandProduct({ ...creating!, title: creating!.title.trim(), description: creating!.description?.trim() || undefined, fabric: creating!.fabric?.trim() || undefined }));
    setCreating(null);
    products.reload();
  });
  const addImage = useAction(async (file: File) => {
    setCreated(await addBrandProductImage(created!.id, file));
    products.reload();
    toast({ title: 'Photo added', description: 'The piece is now live in the catalogue.' });
  });
  const remove = useAction(async (product: BrandProduct) => {
    await deleteBrandProduct(product.id);
    products.reload();
  });

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Your"
        accent="pieces"
        description="Pieces from your shop feed sync every night. Hide any you do not want on Kapra, or list new ones by hand."
        actions={
          <Button onClick={() => setCreating(blank)}>
            <Plus size={15} /> List a piece
          </Button>
        }
      />
      <div className="mb-5 flex max-w-md items-center gap-2 rounded-full border border-hairline bg-card px-4">
        <Search size={15} className="text-muted" />
        <input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          placeholder="Search your products"
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
      </div>

      {products.error && <ErrorNote message={products.error} onRetry={products.reload} />}
      {products.loading && !products.data ? (
        <Skeleton className="h-96" />
      ) : products.data?.data.length === 0 ? (
        <EmptyState title="No pieces found" />
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-hairline bg-card">
          {products.data?.data.map((product) => {
            const expanded = open === product.id;
            const inStock = product.variants?.filter((variant) => variant.inStock).length ?? 0;
            return (
              <div key={product.id} className="border-b border-hairline/70 last:border-0">
                <button type="button" onClick={() => setOpen(expanded ? null : product.id)} className={cn('flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-paper/60', product.hiddenByBrand && 'opacity-60')}>
                  <img src={imageUrl(product.images[0], 100)} alt="" className="h-14 w-11 shrink-0 rounded-md bg-sand object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.title}</p>
                    <p className="text-xs text-muted">
                      {labelOf(product.category)} · {inStock}/{product.variants?.length ?? 0} sizes in stock · {product.externalId ? 'from feed' : 'listed by hand'}
                    </p>
                  </div>
                  <p className="text-sm">{formatPrice(product.price)}</p>
                  {product.hiddenByBrand ? <StatusPill tone="stone">Hidden</StatusPill> : !product.isActive ? <StatusPill tone="henna">Removed in shop</StatusPill> : <StatusPill tone="olive">Live</StatusPill>}
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pl-[4.75rem]">
                        {product.variants?.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            title={variant.inStock ? 'Mark out of stock' : 'Mark in stock'}
                            onClick={() => stock.run(variant.id, !variant.inStock, variant.inStock ? 0 : variant.stockQty ?? null)}
                            className={cn('rounded-full border px-3 py-1 text-xs transition-colors', variant.inStock ? 'border-olive/40 bg-olive/10 text-olive' : 'border-hairline text-stone line-through')}
                          >
                            {variant.size}
                            {variant.stockQty !== null && ` · ${variant.stockQty}`}
                          </button>
                        ))}
                        <span className="ml-auto flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => toggle.run(product)}>
                            {product.hiddenByBrand ? <Eye size={13} /> : <EyeOff size={13} />} {product.hiddenByBrand ? 'Show on Kapra' : 'Hide from Kapra'}
                          </Button>
                          {!product.externalId && (
                            <Button size="sm" variant="quiet" onClick={() => remove.run(product)}>
                              <Trash2 size={13} /> Delete
                            </Button>
                          )}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      {products.data && products.data.meta.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-muted">
            Page {page} of {products.data.meta.totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={page >= products.data.meta.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <Modal
        open={Boolean(creating)}
        onClose={() => setCreating(null)}
        title="List a piece"
        description="Add a photo in the next step; the piece goes live with its first photo."
        className="max-w-2xl"
        footer={
          <Button size="sm" loading={create.running} disabled={!creating || creating.title.trim().length < 3 || creating.price < 200 || creating.sizes.length === 0} onClick={() => create.run()}>
            Continue to photos
          </Button>
        }
      >
        {creating && (
          <div className="space-y-4">
            <TextField label="Title" value={creating.title} onChange={(event) => setCreating({ ...creating, title: event.target.value })} placeholder="e.g. Embroidered lawn kurta" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SelectField label="Category" options={CATEGORIES.map((value) => ({ value, label: labelOf(value) }))} value={creating.category} onChange={(event) => setCreating({ ...creating, category: event.target.value as ProductCategory })} />
              <SelectField label="For" options={[{ value: 'women', label: 'Women' }, { value: 'men', label: 'Men' }, { value: 'unisex', label: 'Unisex' }]} value={creating.gender} onChange={(event) => setCreating({ ...creating, gender: event.target.value as Gender })} />
              <SelectField label="Style" options={[{ value: 'eastern', label: 'Eastern' }, { value: 'western', label: 'Western' }]} value={creating.style} onChange={(event) => setCreating({ ...creating, style: event.target.value as WearStyle })} />
              <TextField label="Price (Rs)" inputMode="numeric" value={String(creating.price)} onChange={(event) => setCreating({ ...creating, price: Number(event.target.value.replace(/\D/g, '')) || 0 })} />
            </div>
            <TextField label="Fabric" value={creating.fabric ?? ''} onChange={(event) => setCreating({ ...creating, fabric: event.target.value })} placeholder="lawn, chiffon, cotton…" />
            <ColourPicker label="Colours" value={creating.colours} onChange={(colours) => setCreating({ ...creating, colours })} />
            <ChipGroup<Occasion> label="Occasions" multiple options={OCCASIONS.map((value) => ({ value, label: labelOf(value) }))} value={creating.occasions} onChange={(occasions) => setCreating({ ...creating, occasions })} />
            <div>
              <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-muted uppercase">Sizes and stock</p>
              <div className="flex flex-wrap gap-2">
                {creating.sizes.map((size, index) => (
                  <span key={size.size} className="flex items-center gap-1 rounded-full border border-hairline bg-paper py-1 pr-1 pl-3 text-sm">
                    {size.size}
                    <input
                      aria-label={`Stock for ${size.size}`}
                      inputMode="numeric"
                      value={size.stockQty}
                      onChange={(event) => setCreating({ ...creating, sizes: creating.sizes.map((item, i) => (i === index ? { ...item, stockQty: Number(event.target.value.replace(/\D/g, '')) || 0 } : item)) })}
                      className="w-10 rounded-full bg-card px-2 text-center text-xs outline-none"
                    />
                    <button type="button" aria-label="Remove size" onClick={() => setCreating({ ...creating, sizes: creating.sizes.filter((_, i) => i !== index) })} className="px-1 text-muted hover:text-henna">
                      ×
                    </button>
                  </span>
                ))}
                {['XS', 'XL', 'XXL', 'Free size'].filter((size) => !creating.sizes.some((item) => item.size === size)).map((size) => (
                  <button key={size} type="button" onClick={() => setCreating({ ...creating, sizes: [...creating.sizes, { size, stockQty: 5 }] })} className="rounded-full border border-dashed border-stone px-3 py-1 text-xs hover:border-ink">
                    + {size}
                  </button>
                ))}
              </div>
            </div>
            <TextAreaField label="Description" value={creating.description ?? ''} maxLength={3000} onChange={(event) => setCreating({ ...creating, description: event.target.value })} />
          </div>
        )}
      </Modal>

      <Modal open={Boolean(created)} onClose={() => setCreated(null)} title="Add photos" description={created?.title}>
        {created && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {created.images.map((src) => (
                <img key={src} src={src.replace('/upload/', '/upload/c_fill,w_160,h_213/')} alt="" className="h-28 w-20 rounded-lg object-cover" />
              ))}
            </div>
            <Dropzone onFile={(file) => addImage.run(file)} disabled={addImage.running} label={addImage.running ? 'Uploading…' : 'Add a product photo'} />
            {created.images.length > 0 && (
              <Button className="w-full" onClick={() => setCreated(null)}>
                Done
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
