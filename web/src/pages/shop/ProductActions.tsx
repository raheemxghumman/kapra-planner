import { ExternalLink, Heart, ScanFace, ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { useWishlist } from '../../hooks/useWishlist';
import type { Product } from '../../types/catalogue';
import { cn } from '../../utils/format';

const WEARABLE = ['kurta', 'top', 'trousers', 'suit', 'dress', 'unstitched', 'outerwear'];

/**
 * What a customer can do with a piece: buy it (partner brands sell on Kapra), try it on,
 * have the stylist build a look around it, save it, or go to the brand's own shop.
 */
export function ProductActions({ product, variantId }: { product: Product; variantId: string | null }) {
  const { user } = useAuth();
  const cart = useCart();
  const { toast } = useToast();
  const { has, toggle } = useWishlist();
  const navigate = useNavigate();
  const partner = Boolean(product.brand.ownerId);
  const variant = product.variants?.find((item) => item.id === variantId);
  const saved = has(product.id);

  /** Customers only: visitors go to login and come back here afterwards. */
  const requireCustomer = (then: () => void) => {
    if (!user) return navigate('/login', { state: { from: `/shop/${product.id}` } });
    if (user.role !== 'customer') return toast({ title: 'Switch to a customer account for this', tone: 'info' });
    then();
  };

  const addToBag = () =>
    requireCustomer(() => {
      if (!variant) return toast({ title: 'Choose a size first', tone: 'info' });
      cart.add({
        variantId: variant.id,
        productId: product.id,
        brandId: product.brandId,
        brandName: product.brand.name,
        brandSlug: product.brand.slug,
        title: product.title,
        size: variant.size,
        image: product.images[0] ?? null,
        price: product.price,
      });
      cart.setOpen(true);
    });

  return (
    <div className="mt-8 space-y-3">
      {partner ? (
        <Button size="lg" className="w-full" onClick={addToBag}>
          <ShoppingBag size={16} /> {variant ? `Add size ${variant.size} to bag` : 'Add to bag'}
        </Button>
      ) : (
        product.productUrl && (
          <a href={product.productUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-[15px] font-semibold text-paper transition-colors hover:bg-olive">
            Buy at {product.brand.name} <ExternalLink size={15} />
          </a>
        )
      )}
      <div className="grid grid-cols-3 gap-2">
        {WEARABLE.includes(product.category) && (
          <Button variant="ghost" onClick={() => requireCustomer(() => navigate(`/app/try-on?product=${product.id}`))}>
            <ScanFace size={15} /> Try on
          </Button>
        )}
        <Button variant="ghost" onClick={() => requireCustomer(() => navigate(`/app/stylist?product=${product.id}`))}>
          <Sparkles size={15} /> Style it
        </Button>
        <Button variant="ghost" onClick={() => toggle(product.id)} aria-pressed={saved}>
          <motion.span key={String(saved)} initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
            <Heart size={15} className={cn(saved && 'fill-henna text-henna')} />
          </motion.span>
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
      {partner ? (
        <p className="text-xs text-muted">Sold on Kapra by {product.brand.name}. Free delivery from Rs 5,000.</p>
      ) : (
        <p className="text-xs text-muted">{product.brand.name} sells on its own website; Kapra shows its catalogue so you can style and try it.</p>
      )}
    </div>
  );
}
