import { motion } from 'motion/react';
import { lazy, Suspense } from 'react';
import { Link } from 'react-router';

const FabricScene = lazy(() => import('../three/FabricScene'));

const COLUMNS = [
  {
    title: 'Plan',
    links: [
      { to: '/stylist', label: 'AI stylist' },
      { to: '/shop', label: 'Catalogue' },
      { to: '/brands', label: 'Brands' },
    ],
  },
  {
    title: 'Stitch',
    links: [
      { to: '/tailors', label: 'Find a tailor' },
      { to: '/register?role=tailor', label: 'Join as a tailor' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { to: '/register?role=brand', label: 'List your brand' },
      { to: '/login', label: 'Partner login' },
    ],
  },
];

/** Closing call to action with the 3D fabric, then links and a full-width wordmark. */
export function SiteFooter({ withCta = true }: { withCta?: boolean }) {
  return (
    <footer className="relative overflow-hidden bg-ink text-paper">
      {withCta && (
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-5 pt-28 md:px-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-paper/50">Ready when you are</p>
            <h2 className="mt-5 text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.02em]">
              Your next occasion, <span className="font-logo italic">sorted.</span>
            </h2>
            <Link
              to="/register"
              className="group mt-10 inline-flex items-center gap-3 rounded-full bg-paper py-3.5 pr-3.5 pl-7 text-sm text-ink transition-colors hover:bg-blush"
            >
              Create a free account
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper transition-transform duration-500 group-hover:rotate-45">
                ↗
              </span>
            </Link>
          </div>
          <div className="h-[340px] md:h-[420px]">
            <Suspense fallback={null}>
              <FabricScene distance={6.5} />
            </Suspense>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pt-20 pb-10 sm:grid-cols-2 md:px-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="max-w-xs text-sm leading-relaxed text-paper/60">
            Kapra Planner brings Pakistani brands, virtual try-on and trusted local tailors into one place.
            A semester project at Air University, Islamabad.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="eyebrow text-paper/40">{column.title}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-paper/80 transition-colors hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <motion.p
        initial={{ y: '40%', opacity: 0 }}
        whileInView={{ y: '0%', opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none -mb-[0.18em] text-center font-logo text-[27vw] leading-[0.8] tracking-[-0.04em] text-paper/[0.07] italic select-none"
        aria-hidden
      >
        kapra
      </motion.p>
    </footer>
  );
}
