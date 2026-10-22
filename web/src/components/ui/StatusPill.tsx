import { cn } from '../../utils/format';

export type Tone = 'olive' | 'henna' | 'sand' | 'ink' | 'blush' | 'stone';

const TONES: Record<Tone, string> = {
  olive: 'bg-olive/12 text-olive',
  henna: 'bg-henna/10 text-henna',
  sand: 'bg-sand text-ink/80',
  ink: 'bg-ink text-paper',
  blush: 'bg-blush/70 text-henna',
  stone: 'bg-stone/20 text-muted',
};

const DOT: Record<Tone, string> = {
  olive: 'bg-olive',
  henna: 'bg-henna',
  sand: 'bg-stone',
  ink: 'bg-paper',
  blush: 'bg-henna',
  stone: 'bg-stone',
};

/** Small rounded label with a dot; `pulse` makes the dot breathe for live states. */
export function StatusPill({
  tone = 'sand',
  pulse = false,
  children,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', DOT[tone])} />}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', DOT[tone])} />
      </span>
      {children}
    </span>
  );
}
