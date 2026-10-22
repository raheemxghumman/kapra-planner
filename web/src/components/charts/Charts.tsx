import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '../../utils/format';

interface Point {
  label: string;
  value: number;
}

/**
 * Hand-made SVG bar chart (no chart library): bars grow in one after another; hovering shows
 * the exact value. Good for 7-30 daily values.
 */
export function BarChart({
  data,
  format = (n) => String(n),
  height = 160,
  className,
}: {
  data: Point[];
  format?: (value: number) => string;
  height?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((point) => point.value));
  const gap = 4;
  const width = 600;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <div className={cn('relative', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" preserveAspectRatio="none" style={{ height }}>
        {[0.25, 0.5, 0.75].map((line) => (
          <line key={line} x1={0} x2={width} y1={height * line} y2={height * line} stroke="var(--color-hairline)" strokeDasharray="2 6" />
        ))}
        {data.map((point, index) => {
          const barHeight = Math.max(point.value > 0 ? 3 : 1, (point.value / max) * (height - 8));
          return (
            <motion.rect
              key={point.label}
              x={index * (barWidth + gap)}
              width={barWidth}
              rx={Math.min(6, barWidth / 2)}
              initial={{ y: height, height: 0 }}
              animate={{ y: height - barHeight, height: barHeight }}
              transition={{ duration: 0.8, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
              fill={hover === index ? 'var(--color-henna)' : point.value > 0 ? 'var(--color-ink)' : 'var(--color-hairline)'}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              className="cursor-crosshair transition-colors"
            />
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1 text-xs whitespace-nowrap text-paper"
          style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
        >
          {data[hover].label}: <b>{format(data[hover].value)}</b>
        </div>
      )}
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Proportion bars, e.g. bookings by status. */
export function BreakdownBars({ items, className }: { items: { label: string; value: number; tone?: string }[]; className?: string }) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm">
            <span>{item.label}</span>
            <span className="text-muted">{item.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hairline/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / total) * 100}%` }}
              transition={{ duration: 1, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: item.tone ?? 'var(--color-ink)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
