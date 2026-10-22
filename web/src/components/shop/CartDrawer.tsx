import { Minus, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { MAX_PER_LINE } from '../../context/cart-context';
import { useCart } from '../../hooks/useCart';
import { FREE_SHIPPING_FROM } from '../../types/orders';
import { formatPrice, imageUrl } from '../../utils/format';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/Feedback';
import { Sheet } from '../ui/Modal';

/** Slide-in cart. Each partner brand ships its own order, so each brand checks out separately. */
export function CartDrawer() {
  const { groups, open, setOpen, setQuantity, remove, count } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Your bag" description={count ? `${count} piece${count > 1 ? 's' : ''}` : undefined}>
      {groups.length === 0 ? (
        <EmptyState title="Empty for now" description="Pieces from partner brands can be bought right here on Kapra." />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const toFree = FREE_SHIPPING_FROM - group.subtotal;
            return (
              <section key={group.brandId}>
                <div className="flex items-baseline justify-between">
                  <p className="eyebrow">{group.brandName}</p>
                  <p className="text-sm">{formatPrice(group.subtotal)}</p>
                </div>
                <ul className="mt-3 divide-y divide-hairline/70 border-y border-hairline/70">
                  <AnimatePresence initial={false}>
                    {group.items.map((item) => (
                      <motion.li
                        key={item.variantId}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3 py-3"
                      >
                        <img src={imageUrl(item.image ?? undefined, 160)} alt="" className="h-20 w-16 shrink-0 rounded-md bg-sand object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{item.title}</p>
                          <p className="text-xs text-muted">Size {item.size}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button type="button" aria-label="One less" onClick={() => setQuantity(item.variantId, item.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-hairline hover:border-ink">
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="One more"
                              disabled={item.quantity >= MAX_PER_LINE}
                              onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                              className="grid h-7 w-7 place-items-center rounded-full border border-hairline hover:border-ink disabled:opacity-40"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
                          <button type="button" aria-label="Remove" onClick={() => remove(item.variantId)} className="text-muted hover:text-henna">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <p className="mt-3 text-xs text-muted">
                  {toFree > 0 ? `Add ${formatPrice(toFree)} more for free delivery from ${group.brandName}.` : 'Free delivery on this order.'}
                </p>
                <Button
                  className="mt-3 w-full"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/app/checkout/${group.brandId}`);
                  }}
                >
                  Checkout {group.brandName}
                </Button>
              </section>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
