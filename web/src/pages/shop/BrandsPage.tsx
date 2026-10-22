import { motion } from 'motion/react';
import { Link } from 'react-router';
import { getBrands } from '../../api/catalogue.api';
import { RevealText } from '../../components/motion/RevealText';
import { useApi } from '../../hooks/useApi';

/** Index of partner brands, set like a magazine contents page. */
export function BrandsPage() {
  const brands = useApi((signal) => getBrands(signal));

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 md:px-10">
      <p className="eyebrow text-muted">Partner brands</p>
      <RevealText
        as="h1"
        text="Twelve houses, *one wardrobe.*"
        className="mt-3 text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-[-0.02em]"
      />
      <ol className="mt-14 border-t border-hairline">
        {brands.data?.map((brand, index) => (
          <motion.li
            key={brand.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: (index % 6) * 0.05 }}
            className="border-b border-hairline"
          >
            <Link
              to={`/shop?brand=${brand.slug}`}
              className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-6 md:grid-cols-[4rem_1fr_1.2fr_auto]"
            >
              <span className="font-logo text-xl text-muted italic">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-[clamp(1.6rem,3vw,2.6rem)] tracking-[-0.01em] transition-transform duration-500 ease-[var(--ease-soft)] group-hover:translate-x-3">
                {brand.name}
                {brand.tier === 'designer' && <span className="eyebrow ml-3 align-middle text-henna">Designer</span>}
              </span>
              <span className="hidden text-sm text-muted md:block">{brand.description}</span>
              <span className="text-sm text-muted">{brand.productCount} pieces →</span>
            </Link>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
