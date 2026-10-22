import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Marquee } from '../../components/motion/Marquee';
import type { BrandSummary, Facets } from '../../types/catalogue';

/** A number that counts up from zero when it scrolls into view. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString('en-PK'));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.8, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, count, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/** Brand ticker plus live catalogue numbers (from the API, not hard-coded). */
export function NumbersBand({ brands, facets }: { brands: BrandSummary[]; facets?: Facets }) {
  const products = facets?.categories.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const stats = [
    { value: brands.length, label: 'Pakistani brands' },
    { value: products, label: 'Pieces in the catalogue' },
    { value: facets?.colours.length ?? 0, label: 'Colours to match' },
  ];

  return (
    <section className="border-y border-hairline bg-paper">
      <Marquee className="border-b border-hairline py-6">
        {brands.map((brand) => (
          <span key={brand.slug} className="flex items-center gap-10 px-5 font-logo text-[clamp(1.6rem,3vw,2.6rem)] italic">
            {brand.name}
            <span className="h-1.5 w-1.5 rounded-full bg-henna" aria-hidden />
          </span>
        ))}
      </Marquee>
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-hairline px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-10">
        {stats.map((stat) => (
          <div key={stat.label} className="py-10 sm:px-8 sm:first:pl-0">
            <p className="text-[clamp(2.6rem,5vw,4.5rem)] leading-none tracking-[-0.03em]">
              <CountUp value={stat.value} />
            </p>
            <p className="eyebrow mt-3 text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
