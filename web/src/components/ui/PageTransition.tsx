import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Wraps a page so it fades and slides in when it appears and out when it leaves.
 * Used together with <AnimatePresence> in App.tsx, which waits for the exit animation
 * before showing the next page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}
