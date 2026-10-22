import { Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useWishlist } from '../../hooks/useWishlist';
import { cn } from '../../utils/format';

/** Heart toggle for product cards; pops and sends out a small ring when saved. */
export function WishlistHeart({ productId, className }: { productId: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const saved = has(productId);
  // Brands, tailors and admins have no wishlist.
  if (user && user.role !== 'customer') return null;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      className={cn('relative grid h-9 w-9 place-items-center rounded-full bg-paper/85 backdrop-blur transition-colors hover:bg-paper', className)}
    >
      <motion.span key={String(saved)} initial={{ scale: saved ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
        <Heart size={16} strokeWidth={1.8} className={saved ? 'fill-henna text-henna' : 'text-ink'} />
      </motion.span>
      <AnimatePresence>
        {saved && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0.7 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full border-2 border-henna"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
