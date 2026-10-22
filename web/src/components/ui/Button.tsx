import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../../utils/format';

type Variant = 'primary' | 'ghost' | 'soft' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-olive',
  ghost: 'border border-hairline bg-transparent text-ink hover:border-ink',
  soft: 'border border-hairline bg-card text-ink hover:bg-paper',
  danger: 'bg-henna text-paper hover:bg-henna/90',
  quiet: 'text-ink/70 hover:bg-ink/5 hover:text-ink',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-[15px]',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/** Button with a little lift on hover, a press on tap and a spinner while loading. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type={type}
      whileHover={isDisabled ? undefined : { y: -1.5 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {loading && (
        <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

/** A link that looks like a Button (for navigation, so it stays a real <a>). */
export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }: ButtonLinkProps) {
  return <Link className={cn(base, VARIANTS[variant], SIZES[size], 'hover:-translate-y-px', className as string)} {...props} />;
}
