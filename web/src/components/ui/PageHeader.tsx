import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  /** Plain words, then an italic accent word: title="Your" accent="outfits". */
  title: string;
  accent?: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Big editorial heading at the top of each dashboard page. */
export function PageHeader({ eyebrow, title, accent, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="eyebrow text-muted"
        >
          {eyebrow}
        </motion.p>
        <h1 className="mt-2 overflow-hidden text-[clamp(2rem,4vw,3.25rem)] leading-[1.02] tracking-[-0.02em]">
          <motion.span
            className="block"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {title} {accent && <span className="font-logo pr-[0.06em] italic">{accent}</span>}
          </motion.span>
        </h1>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted"
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
