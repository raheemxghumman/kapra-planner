import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/format';
import { DASHBOARD_PATH } from '../../utils/roles';

const LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/stylist', label: 'Stylist' },
  { to: '/tailors', label: 'Tailors' },
  { to: '/brands', label: 'Brands' },
];

/**
 * Public top bar. Transparent over the hero, solid after scrolling; slides away while
 * scrolling down and returns on the first scroll up, so it never covers what you read.
 */
export function SiteNav() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(current > previous && current > 160);
    setSolid(current > 24);
  });

  return (
    <motion.header
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-500',
        solid ? 'border-b border-hairline/70 bg-paper/85 backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-10">
        <Link to="/" className="font-logo text-[28px] leading-none italic" aria-label="Kapra Planner home">
          kapra
        </Link>
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className="group relative text-sm text-ink/80 transition-colors hover:text-ink aria-[current=page]:text-ink"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to={DASHBOARD_PATH[user.role]}
              className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-olive"
            >
              My Kapra
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm sm:inline hover:underline">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-olive"
              >
                Start styling
              </Link>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
