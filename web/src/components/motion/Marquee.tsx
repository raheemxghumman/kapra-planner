import type { ReactNode } from 'react';
import { cn } from '../../utils/format';

/**
 * Endless horizontal ticker. The content is rendered twice side by side and the track moves
 * left by exactly half its width, so the loop is seamless. Pauses on hover.
 */
export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('group relative flex overflow-hidden', className)}>
      <div className="flex w-max shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
