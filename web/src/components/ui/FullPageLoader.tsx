import { motion } from 'motion/react';

/** Shown while the app checks whether a saved session can be restored. */
export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
      <motion.span
        className="font-logo text-5xl italic"
        animate={{ opacity: [0.25, 1, 0.25] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        kapra
      </motion.span>
    </div>
  );
}
