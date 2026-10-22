import { ArrowLeftRight, Pencil, ScanFace, Scissors, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { deleteOutfit, getAlternatives, getOutfit, removeOutfitItem, renameOutfit, swapOutfitItem } from '../../../api/customer.api';
import { WishlistHeart } from '../../../components/catalogue/WishlistHeart';
import { OutfitBoard } from '../../../components/outfit/OutfitBoard';
import { Button, ButtonLink } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState, ErrorNote, Skeleton } from '../../../components/ui/Feedback';
import { Sheet } from '../../../components/ui/Modal';
import { useAction } from '../../../hooks/useAction';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../hooks/useToast';
import type { Outfit, OutfitItem } from '../../../types/stylist';
import { formatPrice, imageUrl, labelOf } from '../../../utils/format';

export function OutfitDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const loaded = useApi((signal) => getOutfit(id, signal), [id]);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [swapping, setSwapping] = useState<OutfitItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const current = outfit ?? loaded.data;
  const alternatives = useApi(
    (signal) => (swapping && current ? getAlternatives(current.id, swapping.id, signal) : Promise.resolve([])),
    [swapping?.id],
  );

  const rename = useAction(async () => {
    setOutfit(await renameOutfit(id, name.trim()));
    setEditing(false);
  });
  const swap = useAction(async (productId: string) => {
    setOutfit(await swapOutfitItem(id, swapping!.id, productId));
    setSwapping(null);
    toast({ title: 'Piece swapped' });
  });
  const removeItem = useAction(async (item: OutfitItem) => setOutfit(await removeOutfitItem(id, item.id)));
  const remove = useAction(async () => {
    await deleteOutfit(id);
    toast({ title: 'Look deleted' });
    navigate('/app/outfits');
  });

  if (loaded.loading) return <Skeleton className="h-[520px]" />;
  if (loaded.error || !current) return <ErrorNote message={loaded.error ?? 'Outfit not found'} />;

  const total = current.items.reduce((sum, item) => sum + item.product.price, 0);
  const main = current.items.find((item) => item.slot === 'full_look' || item.slot === 'top') ?? current.items[0];

  return (
    <div>
      <Link to="/app/outfits" className="eyebrow text-muted hover:text-ink">
        ← All looks
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[28px] bg-[#e3dccf] p-6">
          <OutfitBoard items={current.items} />
        </div>

        <div>
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.form
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (name.trim().length >= 1) rename.run();
                }}
                className="flex gap-2"
              >
                <input autoFocus value={name} maxLength={80} onChange={(event) => setName(event.target.value)} className="flex-1 rounded-xl border border-hairline bg-card px-4 py-2 font-logo text-2xl italic outline-none focus:border-olive" />
                <Button type="submit" size="sm" loading={rename.running}>
                  Save
                </Button>
              </motion.form>
            ) : (
              <motion.h1 key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 font-logo text-[2.6rem] leading-tight italic">
                {current.name}
                <button
                  type="button"
                  aria-label="Rename"
                  onClick={() => {
                    setName(current.name);
                    setEditing(true);
                  }}
                  className="text-muted hover:text-ink"
                >
                  <Pencil size={16} />
                </button>
              </motion.h1>
            )}
          </AnimatePresence>
          <p className="mt-1 text-sm text-muted">
            {current.occasion && `${labelOf(current.occasion)} · `}
            {current.items.length} pieces · <span className="text-ink">{formatPrice(total)}</span>
          </p>

          <ul className="mt-6 space-y-2">
            <AnimatePresence initial={false}>
              {current.items.map((item) => (
                <motion.li key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="flex items-center gap-3 rounded-2xl border border-hairline bg-card p-3">
                  <img src={imageUrl(item.product.images[0], 140)} alt="" className="h-16 w-12 rounded-lg bg-sand object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow text-muted">{labelOf(item.slot)}</p>
                    <Link to={`/shop/${item.productId}`} className="block truncate text-sm hover:underline">
                      {item.product.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {item.product.brand.name} · {formatPrice(item.product.price)}
                      {item.variant?.size && ` · ${item.variant.size}`}
                    </p>
                  </div>
                  <WishlistHeart productId={item.productId} className="border border-hairline" />
                  <button type="button" onClick={() => setSwapping(item)} className="flex items-center gap-1 rounded-full border border-hairline px-3 py-1.5 text-xs hover:border-ink">
                    <ArrowLeftRight size={13} /> Swap
                  </button>
                  {current.items.length > 1 && (
                    <button type="button" aria-label="Remove piece" onClick={() => removeItem.run(item)} className="p-1 text-muted hover:text-henna">
                      <Trash2 size={15} />
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            {main && (
              <ButtonLink to={`/app/try-on?product=${main.productId}`}>
                <ScanFace size={15} /> Try it on
              </ButtonLink>
            )}
            <ButtonLink to={`/tailors?outfit=${current.id}`} variant="ghost">
              <Scissors size={15} /> Book a tailor
            </ButtonLink>
            <Button variant="quiet" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> Delete look
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={Boolean(swapping)} onClose={() => setSwapping(null)} title={`Swap the ${swapping ? labelOf(swapping.slot).toLowerCase() : ''}`} description="Similar pieces in colour and style">
        {alternatives.loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="aspect-[3/4]" />
            ))}
          </div>
        ) : alternatives.data?.length ? (
          <div className="grid grid-cols-2 gap-3">
            {alternatives.data.map((product, index) => (
              <motion.button
                key={product.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                disabled={swap.running}
                onClick={() => swap.run(product.id)}
                className="group text-left"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-sand">
                  <img src={imageUrl(product.images[0], 400)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="mt-2 truncate text-sm">{product.title}</p>
                <p className="text-xs text-muted">
                  {product.brand.name} · {formatPrice(product.price)}
                </p>
              </motion.button>
            ))}
          </div>
        ) : (
          <EmptyState title="No close matches" description="Try the catalogue for more options." />
        )}
      </Sheet>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => remove.run()} loading={remove.running} title="Delete this look?" confirmLabel="Delete" danger />
    </div>
  );
}
