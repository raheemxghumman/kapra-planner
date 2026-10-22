import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/format';

interface PanelProps {
  title?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Delay for the entrance animation, so panels on a page arrive one after another. */
  delay?: number;
}

/** The card every dashboard section sits on: paper card, hairline border, soft shadow. */
export function Panel({ title, eyebrow, actions, children, className, bodyClassName, delay = 0 }: PanelProps) {
  const hasHeader = Boolean(title || eyebrow || actions);
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-[22px] border border-hairline bg-card shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_20px_40px_-32px_rgba(43,41,38,0.35)]',
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-lg leading-snug">{title}</h2>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-6', hasHeader && 'pt-4', bodyClassName)}>{children}</div>
    </motion.section>
  );
}
