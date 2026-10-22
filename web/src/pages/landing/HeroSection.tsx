import { motion, useScroll, useTransform } from 'motion/react';
import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router';
import { RevealText } from '../../components/motion/RevealText';
import type { Product } from '../../types/catalogue';

const LookbookScene = lazy(() => import('../../components/three/LookbookScene'));
const FabricScene = lazy(() => import('../../components/three/FabricScene'));

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function HeroSection({ products }: { products: Product[] | undefined }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  // The headline drifts up and fades a little as the hero scrolls away (parallax).
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-25%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const images = products?.slice(0, 9).map((product) => product.images[0]) ?? [];

  return (
    <section ref={section} className="relative min-h-[100svh] overflow-hidden pt-16">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1400px] grid-cols-1 items-center px-5 md:px-10 lg:grid-cols-12">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 py-10 lg:col-span-6">
          <motion.p {...fade(0.1)} className="eyebrow flex items-center gap-3 text-muted">
            <span className="h-px w-10 bg-ink/40" />
            Outfit planner · Pakistan
          </motion.p>
          <RevealText
            as="h1"
            delay={0.2}
            text="Plan it. *Try it.* Get it stitched."
            className="mt-6 text-[clamp(3rem,8vw,7.5rem)] leading-[0.92] tracking-[-0.02em]"
          />
          <motion.p {...fade(0.9)} className="mt-8 max-w-md text-lg leading-relaxed text-ink/75">
            Tell Kapra the occasion and your budget. It puts together complete looks from Pakistani
            brands, shows them on your own photo, and books a tailor near you to stitch them.
          </motion.p>
          <motion.div {...fade(1.05)} className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/stylist"
              className="group inline-flex items-center gap-3 rounded-full bg-ink py-3.5 pr-3.5 pl-7 text-sm text-paper transition-colors hover:bg-olive"
            >
              Style my occasion
              <span className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink transition-transform duration-500 group-hover:rotate-45">
                ↗
              </span>
            </Link>
            <Link to="/shop" className="text-sm underline decoration-ink/30 underline-offset-[6px] hover:decoration-ink">
              Browse the catalogue
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[52svh] lg:col-span-6 lg:h-[86svh]"
        >
          <Suspense fallback={null}>
            {images.length >= 6 ? <LookbookScene images={images} /> : <FabricScene distance={6} />}
          </Suspense>
          <p className="eyebrow pointer-events-none absolute right-0 bottom-6 text-muted">
            Real pieces · live prices · 12 brands
          </p>
        </motion.div>
      </div>

      <motion.div
        {...fade(1.4)}
        className="eyebrow absolute bottom-6 left-5 hidden items-center gap-3 text-muted md:left-10 md:flex"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block"
        >
          ↓
        </motion.span>
        Scroll
      </motion.div>
    </section>
  );
}
