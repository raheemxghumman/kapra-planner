import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

/**
 * A small dot that follows the mouse with a soft spring and turns into a labelled circle
 * over elements marked data-cursor="View" (any text). Only on devices with a real mouse;
 * the normal cursor is never hidden, so nothing becomes harder to use.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const { pathname } = useLocation();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduced) return;
    setEnabled(true);

    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor]');
      setLabel(target?.dataset.cursor ?? null);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [x, y]);

  // A new page may not have the element the cursor was over; clear the label.
  useEffect(() => setLabel(null), [pathname]);

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
