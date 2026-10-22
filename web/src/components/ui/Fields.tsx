import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/format';

const labelClass = 'mb-1.5 block text-xs font-semibold tracking-[0.14em] text-muted uppercase';
const controlClass =
  'w-full rounded-xl border border-hairline bg-card px-4 py-3 text-ink transition duration-200 outline-none placeholder:text-stone focus:border-olive focus:bg-paper focus:ring-4 focus:ring-olive/15';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, options, placeholder, className, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <select id={id} className={cn(controlClass, 'appearance-none pr-10')} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, className, ...props }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea id={id} rows={3} className={cn(controlClass, 'resize-none')} {...props} />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** On/off switch with a sliding knob. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-hairline bg-card px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-olive' : 'bg-stone/40')}>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 34 }}
          className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow', checked ? 'right-0.5' : 'left-0.5')}
        />
      </span>
    </button>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: ReactNode;
}

/** A row of pill buttons. Single choice by default; `multiple` allows several. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple = false,
  max,
}: {
  label?: string;
  options: ChipOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  multiple?: boolean;
  max?: number;
}) {
  const toggle = (option: T) => {
    if (!multiple) return onChange([option]);
    if (value.includes(option)) return onChange(value.filter((item) => item !== option));
    if (max && value.length >= max) return;
    onChange([...value, option]);
  };
  return (
    <fieldset>
      {label && <legend className={labelClass}>{label}</legend>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors',
                active ? 'border-ink bg-ink text-paper' : 'border-hairline bg-card hover:border-ink',
              )}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Slider with the current value shown big above it (used for budgets). */
export function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <motion.span key={value} initial={{ y: -4, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className="shrink-0 font-logo text-2xl whitespace-nowrap italic">
          {format(value)}
        </motion.span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="kapra-range mt-3 w-full"
        style={{ '--fill': `${percent}%` } as React.CSSProperties}
      />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
