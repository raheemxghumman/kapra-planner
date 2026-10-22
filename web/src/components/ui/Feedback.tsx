import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/format';

/** Grey shimmering block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('kapra-shimmer rounded-xl bg-sand/70', className)} />;
}

/** A needle pulling a thread: drawn line by line, used when a list is empty. */
function ThreadArt() {
  return (
    <svg viewBox="0 0 160 90" className="h-20 w-36 text-ink/70" fill="none" aria-hidden>
      <motion.path
        d="M8 70 C 40 20, 70 85, 100 40 S 140 30, 152 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="1 0"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.g initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.6 }}>
        <path d="M146 10 L 158 26" stroke="var(--color-henna)" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="148" cy="12.5" rx="1.4" ry="2.4" transform="rotate(-37 148 12.5)" stroke="var(--color-henna)" strokeWidth="1" />
      </motion.g>
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <ThreadArt />
      <p className="mt-4 font-logo text-3xl italic">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-henna/25 bg-henna/5 px-5 py-4 text-sm text-henna">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-3 font-semibold underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}
