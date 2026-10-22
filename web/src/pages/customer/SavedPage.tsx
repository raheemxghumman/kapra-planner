import { getWishlist } from '../../api/customer.api';
import { ProductCard } from '../../components/catalogue/ProductCard';
import { WishlistHeart } from '../../components/catalogue/WishlistHeart';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { useApi } from '../../hooks/useApi';
import { useWishlist } from '../../hooks/useWishlist';

export function SavedPage() {
  const saved = useApi((signal) => getWishlist(signal));
  const { has } = useWishlist();
  // Hearts update instantly; unsaved pieces disappear without reloading the list.
  const visible = saved.data?.filter((product) => has(product.id)) ?? [];

  return (
    <div>
      <PageHeader eyebrow="Saved" title="Pieces you" accent="love" description="Use them to try on, or ask the stylist to build a look around one." />
      {saved.error && <ErrorNote message={saved.error} onRetry={saved.reload} />}
      {saved.loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="aspect-[3/4]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing saved" description="Tap the heart on any piece in the catalogue." action={<ButtonLink to="/shop">Browse the catalogue</ButtonLink>} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {visible.map((product, index) => (
            <div key={product.id}>
              <ProductCard product={product} index={index} action={<WishlistHeart productId={product.id} />} />
              <div className="mt-3 flex gap-2">
                <ButtonLink to={`/app/try-on?product=${product.id}`} size="sm" variant="ghost" className="flex-1">
                  Try on
                </ButtonLink>
                <ButtonLink to={`/app/stylist?product=${product.id}`} size="sm" variant="ghost" className="flex-1">
                  Style it
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
