import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Product } from '../../types/catalogue';
import { cn, formatPrice, imageUrl, labelOf } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  /** Optional overlay control, e.g. the wishlist heart. */
  action?: ReactNode;
  className?: string;
  index?: number;
}

/**
 * Product tile: the second photo fades in on hover, the image eases forward slightly,
 * and a sale price shows the original crossed out.
 */
export function ProductCard({ product, action, className, index = 0 }: ProductCardProps) {
  const [front, back] = product.images;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn('group relative', className)}
    >
      <Link to={`/shop/${product.id}`} data-cursor="View" className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[2px] bg-sand">
          <img
            src={imageUrl(front, 600)}
            alt={product.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
          />
          {back && (
            <img
              src={imageUrl(back, 600)}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
          {onSale && (
            <span className="eyebrow absolute top-3 left-3 bg-henna px-2 py-1 text-[10px] text-paper">Sale</span>
          )}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-muted">{product.brand.name}</p>
            <h3 className="mt-1 truncate text-[15px] leading-snug">{product.title}</h3>
            <p className="mt-0.5 text-xs text-muted">{labelOf(product.category)}</p>
          </div>
          <div className="shrink-0 text-right text-sm">
            <p className="font-semibold">{formatPrice(product.price)}</p>
            {onSale && <p className="text-xs text-muted line-through">{formatPrice(product.compareAtPrice!)}</p>}
          </div>
        </div>
      </Link>
      {action && <div className="absolute top-2 right-2">{action}</div>}
    </motion.article>
  );
}
