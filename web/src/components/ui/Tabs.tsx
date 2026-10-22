import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '../../utils/format';

interface TabsProps<T extends string> {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Segmented control; the highlight glides to the selected tab. */
export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  const groupId = useId();
  return (
    <div role="tablist" className={cn('no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-hairline bg-card p-1', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn('relative rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors', active ? 'text-paper' : 'text-muted hover:text-ink')}
          >
            {active && (
              <motion.span
                layoutId={`tab-${groupId}`}
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
              />
            )}
            <span className="relative">
              {tab.label}
              {tab.count !== undefined && <span className={cn('ml-1.5 text-xs', active ? 'text-paper/70' : 'text-stone')}>{tab.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
