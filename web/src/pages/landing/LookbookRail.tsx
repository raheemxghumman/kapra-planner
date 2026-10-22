import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Link } from 'react-router';
import type { Product } from '../../types/catalogue';
import { formatPrice, imageUrl } from '../../utils/format';

/**
 * "This week's edit": vertical scrolling moves a row of large product photos sideways.
 * The section is taller than the screen and the row is pinned (sticky) while it slides.
 */
export function LookbookRail({ products }: { products: Product[] }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-68%']);

  if (products.length === 0) return null;

  return (
    <section ref={section} className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-10 flex w-full max-w-[1400px] items-end justify-between px-5 md:px-10">
          <div>
            <p className="eyebrow text-muted">This week's edit</p>
            <h2 className="mt-3 text-[clamp(2.2rem,5vw,4.5rem)] leading-none tracking-[-0.02em]">
              Pieces <span className="font-logo italic">worth</span> planning around
            </h2>
          </div>
          <Link to="/shop" className="hidden text-sm underline underline-offset-[6px] md:block">
            See everything
          </Link>
        </div>
        <motion.div style={{ x }} className="flex gap-6 pl-5 md:gap-10 md:pl-10">
          {products.map((product, index) => (
            <Link
              key={product.id}
              to={`/shop/${product.id}`}
              data-cursor="View"
              className="group relative w-[68vw] shrink-0 sm:w-[40vw] lg:w-[24vw]"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                <img
                  src={imageUrl(product.images[0], 800)}
                  alt={product.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-soft)] group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 font-logo text-2xl text-paper italic mix-blend-difference">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow text-muted">{product.brand.name}</p>
                  <p className="mt-1 truncate">{product.title}</p>
                </div>
                <p className="shrink-0 text-sm">{formatPrice(product.price)}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
