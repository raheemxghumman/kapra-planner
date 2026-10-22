import { MoveHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '../../utils/format';

/** Before/after: drag the handle (or use arrow keys) to reveal more of either picture. */
export function CompareSlider({ before, after, className }: { before: string; after: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);

  const moveTo = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div
      ref={box}
      className={cn('relative touch-none overflow-hidden rounded-[22px] bg-sand select-none', className)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event.clientX);
      }}
      onPointerMove={(event) => event.buttons && moveTo(event.clientX)}
    >
      <img src={after} alt="Try-on result" className="block h-full w-full object-cover" draggable={false} />
      <img
        src={before}
        alt="Your photo"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />
      <span className="eyebrow absolute top-3 left-3 rounded-full bg-paper/85 px-2.5 py-1 text-[10px]">You</span>
      <span className="eyebrow absolute top-3 right-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] text-paper">Wearing it</span>
      <div className="absolute inset-y-0 w-px bg-paper" style={{ left: `${position}%` }}>
        <button
          type="button"
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setPosition((value) => Math.max(0, value - 5));
            if (event.key === 'ArrowRight') setPosition((value) => Math.min(100, value + 5));
          }}
          className="absolute top-1/2 left-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-paper bg-ink/70 text-paper backdrop-blur"
        >
          <MoveHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
