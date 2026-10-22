import { AnimatePresence, motion } from 'motion/react';

/** Error from the server (e.g. "Invalid email or password"), shown above the submit button. */
export function FormError({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden rounded-xl border border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
