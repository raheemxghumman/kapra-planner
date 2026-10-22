import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '../../utils/format';

const ROLES = [
  {
    key: 'customer',
    label: 'Customers',
    screen: '/showcase/stylist.webp',
    second: '/showcase/tailors.webp',
    title: 'Plan, try, stitch.',
    points: ['AI stylist builds complete looks within your budget', 'Try any piece on your own photo', 'Book a ranked tailor and track it live'],
    cta: { to: '/register', label: 'Start styling' },
  },
  {
    key: 'tailor',
    label: 'Tailors',
    screen: '/showcase/tailor.webp',
    title: 'Paid requests, no haggling.',
    points: ['Customers find you on the map', 'Measurements and the look arrive with the booking', 'Your score rises with good reviews'],
    cta: { to: '/register?role=tailor', label: 'Join as a tailor' },
  },
  {
    key: 'brand',
    label: 'Brands',
    screen: '/showcase/brand.webp',
    title: 'Sold where outfits are planned.',
    points: ['Your feed syncs every night', 'Orders, stock and stores in one place', 'See how often the stylist picks your pieces'],
    cta: { to: '/register?role=brand', label: 'List your brand' },
  },
  {
    key: 'admin',
    label: 'Admins',
    screen: '/showcase/admin.webp',
    title: 'The whole platform at a glance.',
    points: ['Verify brands and tailors', 'Moderate reviews flagged by the language model', 'Run the catalogue sync on demand'],
    cta: null,
  },
] as const;

/**
 * "Inside Kapra": real screens of each role's studio. The screen starts tilted back in 3D and
 * straightens as the section scrolls into view; tabs switch roles with a crossfade.
 */
export function ShowcaseSection() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const rotateX = useTransform(smooth, [0, 1], [26, 0]);
  const scale = useTransform(smooth, [0, 1], [0.84, 1]);
  const lift = useTransform(smooth, [0, 1], [120, 0]);
  const backY = useTransform(smooth, [0, 1], [200, 40]);
  const role = ROLES[active];

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink py-28 text-paper md:py-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <div>
            <p className="eyebrow text-paper/50">Inside Kapra</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.98] tracking-[-0.03em]">
              One studio for every <span className="font-logo italic">side</span> of the outfit.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end" role="tablist">
            {ROLES.map((item, index) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={index === active}
                onClick={() => setActive(index)}
                className={cn('relative rounded-full border px-5 py-2.5 text-sm transition-colors', index === active ? 'border-paper text-ink' : 'border-paper/20 text-paper/70 hover:text-paper')}
              >
                {index === active && <motion.span layoutId="showcase-tab" className="absolute inset-0 rounded-full bg-paper" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[320px_1fr] lg:items-center">
          <AnimatePresence mode="wait">
            <motion.div key={role.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4 }}>
              <p className="font-logo text-4xl leading-tight italic">{role.title}</p>
              <ul className="mt-6 space-y-4">
                {role.points.map((point, index) => (
                  <motion.li key={point} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.08 }} className="flex gap-3 text-paper/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blush" />
                    {point}
                  </motion.li>
                ))}
              </ul>
              {role.cta && (
                <Link to={role.cta.to} className="mt-8 inline-flex rounded-full bg-paper px-6 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5">
                  {role.cta.label}
                </Link>
              )}
            </motion.div>
          </AnimatePresence>

          <div style={{ perspective: 1600 }} className="relative">
            {'second' in role && (
              <motion.img
                key={`${role.key}-back`}
                src={role.second}
                alt=""
                aria-hidden
                style={{ y: backY }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                className="absolute -top-10 -right-6 hidden w-[62%] rotate-3 rounded-2xl shadow-2xl lg:block"
              />
            )}
            <motion.div style={{ rotateX, scale, y: lift, transformOrigin: 'center bottom' }} className="relative overflow-hidden rounded-[22px] border border-paper/15 bg-paper shadow-[0_60px_120px_-40px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-1.5 border-b border-ink/10 bg-card px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-henna/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-sand" />
                <span className="h-2.5 w-2.5 rounded-full bg-olive/60" />
                <span className="mx-auto rounded-full bg-paper px-4 py-0.5 text-[11px] text-muted">kapra · {role.label.toLowerCase()} studio</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.img
                  key={role.screen}
                  src={role.screen}
                  alt={`${role.label} studio in Kapra`}
                  loading="lazy"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="block aspect-[16/10] w-full object-cover"
                />
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
