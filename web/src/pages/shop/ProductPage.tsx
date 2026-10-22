import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { getProduct, getSimilarProducts } from '../../api/catalogue.api';
import { ProductCard } from '../../components/catalogue/ProductCard';
import { WishlistHeart } from '../../components/catalogue/WishlistHeart';
import { useApi } from '../../hooks/useApi';
import { COLOUR_HEX } from '../../utils/colours';
import { cn, formatPrice, imageUrl, labelOf } from '../../utils/format';
import { ProductActions } from './ProductActions';

export function ProductPage() {
  const { id = '' } = useParams();
  const product = useApi((signal) => getProduct(id, signal), [id]);
  const similar = useApi((signal) => getSimilarProducts(id, signal), [id]);
  const [size, setSize] = useState<string | null>(null);

  if (product.loading) {
    return (
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pt-28 md:px-10 lg:grid-cols-2">
        <div className="aspect-[3/4] animate-pulse bg-sand" />
        <div className="space-y-4 pt-10">
          <div className="h-4 w-24 animate-pulse rounded bg-sand" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-sand" />
        </div>
      </div>
    );
  }
  if (product.error || !product.data) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-40 pb-24 text-center">
        <p className="font-logo text-5xl italic">Not found</p>
        <p className="mt-4 text-muted">{product.error ?? 'This piece is no longer available.'}</p>
        <Link to="/shop" className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm text-paper">
          Back to the catalogue
        </Link>
      </div>
    );
  }

  const item = product.data;
  const variants = item.variants ?? [];
  const onSale = item.compareAtPrice && item.compareAtPrice > item.price;
  const facts = [
    ['Category', labelOf(item.category)],
    ['Style', labelOf(item.style)],
    ['For', labelOf(item.gender)],
    ['Fabric', item.fabric ? labelOf(item.fabric) : '—'],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-24 pb-24 md:px-10">
      <nav className="eyebrow mb-6 text-muted" aria-label="Breadcrumb">
        <Link to="/shop" className="hover:text-ink">
          Catalogue
        </Link>{' '}
        /{' '}
        <Link to={`/shop?brand=${item.brand.slug}`} className="hover:text-ink">
          {item.brand.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="grid grid-cols-2 gap-2 lg:col-span-7">
          {item.images.map((src, index) => (
            <motion.img
              key={src}
              src={imageUrl(src, index === 0 ? 1100 : 700)}
              alt={index === 0 ? item.title : ''}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={cn('w-full bg-sand object-cover', index === 0 ? 'col-span-2 aspect-[4/5]' : 'aspect-[3/4]')}
            />
          ))}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow text-muted">{item.brand.name}</p>
            <h1 className="mt-3 text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] tracking-[-0.01em]">{item.title}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-2xl">{formatPrice(item.price)}</p>
              {onSale && <p className="text-muted line-through">{formatPrice(item.compareAtPrice!)}</p>}
            </div>

            {item.colours.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {item.colours.map((colour) => (
                  <span key={colour} className="flex items-center gap-1.5 text-sm">
                    <span
                      className="h-4 w-4 rounded-full border border-ink/15"
                      style={{ background: COLOUR_HEX[colour] ?? '#ccc' }}
                    />
                    {labelOf(colour)}
                  </span>
                ))}
              </div>
            )}

            {variants.length > 0 && (
              <fieldset className="mt-8">
                <legend className="eyebrow mb-3 text-muted">Size</legend>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button
                      type="button"
                      key={variant.id}
                      disabled={!variant.inStock}
                      aria-pressed={size === variant.id}
                      onClick={() => setSize(variant.id)}
                      className={cn(
                        'min-w-12 rounded-full border px-4 py-2 text-sm transition-colors',
                        size === variant.id ? 'border-ink bg-ink text-paper' : 'border-hairline hover:border-ink',
                        !variant.inStock && 'cursor-not-allowed text-stone line-through hover:border-hairline',
                      )}
                    >
                      {variant.size}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <ProductActions product={item} variantId={size} />

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-hairline pt-6 text-sm">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow text-muted">{label}</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
              <div className="col-span-2">
                <dt className="eyebrow text-muted">Occasions</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {item.occasions.map((occasion) => (
                    <Link
                      key={occasion}
                      to={`/shop?occasion=${occasion}`}
                      className="rounded-full border border-hairline px-3 py-1 text-xs hover:border-ink"
                    >
                      {labelOf(occasion)}
                    </Link>
                  ))}
                </dd>
              </div>
            </dl>

            {item.description && (
              <p className="mt-8 border-t border-hairline pt-6 text-sm leading-relaxed text-ink/70">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {similar.data && similar.data.length > 0 && (
        <section className="mt-28">
          <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] tracking-[-0.01em]">
            You may <span className="font-logo italic">also</span> like
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {similar.data.slice(0, 8).map((other, index) => (
              <ProductCard key={other.id} product={other} index={index} action={<WishlistHeart productId={other.id} />} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
