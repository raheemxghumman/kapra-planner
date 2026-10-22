import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

/**
 * A small dot that follows the mouse with a soft spring and turns into a labelled circle
 * over elements marked data-cursor="View" (any text). Only on devices with a real mouse;
 * the normal cursor is never hidden, so nothing becomes harder to use.
 */
export function CustomCursor() {
  // Decided once: only devices with a precise pointer (mouse) and no reduced-motion preference.
  const [enabled] = useState(
    () =>
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const { pathname } = useLocation();
  // The label belongs to the page it was set on, so it disappears by itself after navigation.
  const [hover, setHover] = useState<{ label: string | null; path: string }>({ label: null, path: pathname });
  const label = hover.path === pathname ? hover.label : null;
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (!enabled) return;
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor]');
      setHover({ label: target?.dataset.cursor ?? null, path: window.location.pathname });
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[70] flex items-center justify-center rounded-full bg-ink text-paper mix-blend-normal"
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      animate={{ width: label ? 84 : 8, height: label ? 84 : 8, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <AnimatePresence>
        {label && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="eyebrow text-[10px]"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
