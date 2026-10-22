import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useRef, useState } from 'react';
import type { Product } from '../../types/catalogue';
import { formatPrice, imageUrl } from '../../utils/format';

const STEPS = [
  {
    label: 'Plan',
    title: 'Describe the day. Get the whole look.',
    text: 'Mehndi on Friday, Rs 15,000, something pastel. The stylist searches thousands of in-stock pieces across brands and returns complete outfits with the total and a reason for every piece.',
  },
  {
    label: 'Try on',
    title: 'See it on you before you spend.',
    text: 'Upload one full-length photo. Kapra renders the outfit on you, so you can compare looks side by side instead of guessing from a model shot.',
  },
  {
    label: 'Stitch',
    title: 'A tailor you can trust, a few streets away.',
    text: 'Unstitched suit? Find rated tailors on the map, book and pay online, then follow every step from fabric received to ready, and chat whenever you need to.',
  },
];

function StylistVisual({ products }: { products: Product[] }) {
  const picks = products.slice(0, 3);
  const total = picks.reduce((sum, product) => sum + product.price, 0);
  return (
    <div className="w-full max-w-md rounded-[28px] border border-hairline bg-card p-5 shadow-[0_30px_80px_-40px_rgba(43,41,38,0.45)]">
      <div className="flex flex-wrap gap-2">
        {['Mehndi', 'Rs 15,000', 'Pastel', 'Eastern'].map((chip, index) => (
          <motion.span
            key={chip}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.12 }}
            className="rounded-full border border-hairline bg-paper px-3 py-1 text-xs"
          >
            {chip}
          </motion.span>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {picks.map((product, index) => (
          <motion.figure
            key={product.id}
            initial={{ opacity: 0, y: 24, rotate: index === 1 ? 0 : index === 0 ? -3 : 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={imageUrl(product.images[0], 300)} alt="" className="aspect-[3/4] w-full rounded-lg object-cover" />
            <figcaption className="mt-1 truncate text-[11px] text-muted">{product.brand.name}</figcaption>
          </motion.figure>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm"
      >
        <span className="text-muted">Complete look</span>
        <span className="font-semibold">{formatPrice(total)}</span>
      </motion.div>
    </div>
  );
}

function TryOnVisual({ product }: { product?: Product }) {
  return (
    <div className="relative w-full max-w-sm">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-sand">
        {product && (
          <img src={imageUrl(product.images[0], 700)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {/* The "rendering" sweep: a soft line moving down, revealing the result above it. */}
        <motion.div
          className="absolute inset-x-0 top-0 bg-paper/70 backdrop-blur-sm"
          initial={{ height: '100%' }}
          animate={{ height: ['100%', '0%'] }}
          transition={{ duration: 2.4, ease: [0.65, 0, 0.35, 1], repeat: Infinity, repeatDelay: 1.4 }}
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-henna shadow-[0_0_24px_4px_rgba(140,59,46,0.55)]" />
        </motion.div>
      </div>
      <div className="absolute -bottom-5 -left-5 rounded-2xl border border-hairline bg-card px-4 py-3 shadow-lg">
        <p className="eyebrow text-muted">Try-on</p>
        <p className="text-sm">Rendering on your photo…</p>
      </div>
    </div>
  );
}

const TIMELINE = ['Booked', 'Fabric received', 'Stitching', 'Ready'];
const PINS = [
  { x: 28, y: 34, best: false },
  { x: 55, y: 48, best: true },
  { x: 70, y: 26, best: false },
  { x: 40, y: 68, best: false },
];

function StitchVisual() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-hairline bg-sand">
        {/* A stylised street grid in the spirit of Islamabad's sectors. */}
        <svg viewBox="0 0 100 75" className="absolute inset-0 h-full w-full" aria-hidden>
          {[15, 35, 55, 75].map((y) => (
            <line key={`h${y}`} x1="0" x2="100" y1={y * 0.75} y2={y * 0.75} stroke="#cfc8bc" strokeWidth="0.6" />
          ))}
          {[20, 45, 70, 92].map((x) => (
            <line key={`v${x}`} x1={x} x2={x} y1="0" y2="75" stroke="#cfc8bc" strokeWidth="0.6" />
          ))}
          <path d="M0 60 C 30 50, 55 66, 100 40" stroke="#a69e91" strokeWidth="1.4" fill="none" />
        </svg>
        {PINS.map((pin, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.15, type: 'spring', stiffness: 300, damping: 18 }}
          >
            {pin.best && (
              <motion.span
                className="absolute -inset-3 rounded-full bg-henna/30"
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            )}
            <span className={`relative block h-3 w-3 rounded-full border-2 border-paper ${pin.best ? 'bg-henna' : 'bg-ink'}`} />
          </motion.div>
        ))}
        <div className="absolute right-4 bottom-4 rounded-xl bg-card/95 px-3 py-2 text-xs shadow">
          <p className="font-semibold">Master Tailors · G-9</p>
          <p className="text-muted">★ 4.8 · 1.2 km · best match</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-card p-4">
        {TIMELINE.map((step, index) => (
          <div key={step} className="flex flex-1 flex-col gap-2">
            <motion.span
              className="h-1 rounded-full bg-hairline"
              initial={{ backgroundColor: '#cfc8bc' }}
              animate={{ backgroundColor: index < 3 ? '#4f5a3a' : '#cfc8bc' }}
              transition={{ delay: 0.5 + index * 0.35 }}
            />
            <span className="text-[11px] text-muted">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Scroll-driven story: the section is three screens tall and its content stays pinned while
 * the user scrolls; scroll progress decides which step and visual are shown.
 */
export function StorySection({ products }: { products: Product[] }) {
  const container = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: container, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    setStep(Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length)));
  });

  return (
    <section ref={container} id="how-it-works" className="relative h-[300vh] bg-card">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-5 md:px-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow text-muted">How it works</p>
            <div className="mt-8 flex gap-6">
              {STEPS.map((item, index) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => {
                    const top = container.current!.offsetTop + (index / STEPS.length) * container.current!.offsetHeight;
                    window.scrollTo({ top: top + 2, behavior: 'smooth' });
                  }}
                  className={`eyebrow transition-colors ${index === step ? 'text-ink' : 'text-stone hover:text-muted'}`}
                >
                  0{index + 1} {item.label}
                </button>
              ))}
            </div>
            <div className="relative mt-8 h-1 overflow-hidden rounded-full bg-hairline">
              <motion.div className="h-full origin-left bg-olive" style={{ scaleX: scrollYProgress }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10"
              >
                <h2 className="text-[clamp(2rem,4vw,3.6rem)] leading-[1.02] tracking-[-0.015em]">
                  {STEPS[step].title}
                </h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">{STEPS[step].text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="relative flex min-h-[420px] items-center justify-center lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.94, rotateY: -12 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.96, rotateY: 12 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ perspective: 1200 }}
                className="flex w-full justify-center"
              >
                {step === 0 && <StylistVisual products={products} />}
                {step === 1 && <TryOnVisual product={products[3] ?? products[0]} />}
                {step === 2 && <StitchVisual />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
