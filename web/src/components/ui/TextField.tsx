import { AnimatePresence, motion } from 'motion/react';
import { useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled input with an animated error message. Works as a controlled component. */
export function TextField({ label, error, hint, className = '', ...inputProps }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={`w-full rounded-xl border bg-card px-4 py-3 text-ink transition duration-200 outline-none placeholder:text-stone focus:bg-paper focus:ring-4 ${
          error
            ? 'border-red-700/60 focus:ring-red-700/10'
            : 'border-hairline focus:border-olive focus:ring-olive/15'
        }`}
        {...inputProps}
      />
      <AnimatePresence initial={false} mode="wait">
        {(error ?? hint) && (
          <motion.p
            key={error ?? hint}
            id={messageId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className={`mt-1.5 text-xs ${error ? 'text-red-800' : 'text-muted'}`}
          >
            {error ?? hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
