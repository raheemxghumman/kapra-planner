import type { Product } from '../../types/catalogue';

/**
 * Buttons under the size picker. Wishlist and cart are wired in as those features are built;
 * the brand link always works.
 */
export function ProductActions({ product }: { product: Product; variantId: string | null }) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      {product.productUrl && (
        <a
          href={product.productUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-hairline px-6 py-3.5 text-center text-sm transition-colors hover:border-ink"
        >
          View at {product.brand.name} ↗
        </a>
      )}
    </div>
  );
}
