import { Star } from 'lucide-react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/format';

/** A number that counts up from 0 the first time it scrolls into view. */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en-PK') }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, format);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, value, motionValue]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Key figure on a dashboard: label, big number, optional note underneath. */
export function Stat({
  label,
  value,
  format,
  note,
  icon,
  className,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  note?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[20px] border border-hairline bg-card p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="eyebrow text-muted">{label}</p>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p className="mt-3 text-[2.1rem] leading-none tracking-[-0.02em]">
        <CountUp value={value} format={format} />
      </p>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - star + 1));
        return (
          <span key={star} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-stone/50" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="fill-henna text-henna" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Five clickable stars for writing a review. */
export function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const words = ['', 'Poor', 'Below average', 'Good', 'Very good', 'Excellent'];
  return (
    <div className="flex items-center gap-3">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className="p-1"
          >
            <Star size={26} strokeWidth={1.4} className={cn(star <= shown ? 'fill-henna text-henna' : 'text-stone')} />
          </motion.button>
        ))}
      </div>
      <span className="text-sm text-muted">{words[shown]}</span>
    </div>
  );
}

/** Initials in a circle, coloured from the name so each person keeps the same colour. */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const palette = ['#4f5a3a', '#8c3b2e', '#2b2926', '#7a746b', '#a3684f'];
  const colour = palette[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length];
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full text-paper', className)}
      style={{ width: size, height: size, background: colour, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}
