import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

const STEPS = [
  'Reading your style profile and sizes',
  'Searching about 5,000 pieces from 12 brands',
  'Matching the occasion and your colours',
  'Checking which sizes are in stock',
  'Keeping every look within your budget',
  'Writing down why each piece works',
];

/** What the customer watches while the AI works (10-50 s): a needle stitching and live steps. */
export function StylistThinking() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <svg viewBox="0 0 240 80" className="h-20 w-60" aria-hidden>
        <motion.path
          d="M10 40 Q 40 10 70 40 T 130 40 T 190 40 T 230 40"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          strokeDasharray="6 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.g
          animate={{ x: [0, 220, 220], opacity: [1, 1, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M6 30 L 18 48" stroke="var(--color-henna)" strokeWidth="2.4" strokeLinecap="round" />
        </motion.g>
      </svg>
      <p className="mt-6 font-logo text-3xl italic">Styling you</p>
      <div className="mt-3 h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-muted"
          >
            {STEPS[step]}…
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-6 flex gap-1.5">
        {STEPS.map((label, index) => (
          <motion.span key={label} animate={{ backgroundColor: index <= step ? 'var(--color-ink)' : 'var(--color-hairline)', width: index === step ? 22 : 8 }} className="h-1.5 rounded-full" />
        ))}
      </div>
    </div>
  );
}
