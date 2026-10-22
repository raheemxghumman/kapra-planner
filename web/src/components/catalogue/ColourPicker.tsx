import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { COLOUR_HEX, COLOUR_NAMES } from '../../utils/colours';
import { cn, labelOf } from '../../utils/format';

/** Round swatches; selected ones get a tick. `max` caps how many can be picked. */
export function ColourPicker({
  label,
  value,
  onChange,
  max = 4,
  exclude = [],
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  exclude?: string[];
}) {
  const toggle = (colour: string) => {
    if (value.includes(colour)) onChange(value.filter((item) => item !== colour));
    else if (value.length < max) onChange([...value, colour]);
  };
  return (
    <fieldset>
      <legend className="mb-2 flex w-full justify-between text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
        <span className="tracking-normal normal-case">
          {value.length}/{max}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {COLOUR_NAMES.filter((colour) => !exclude.includes(colour)).map((colour) => {
          const active = value.includes(colour);
          return (
            <motion.button
              key={colour}
              type="button"
              title={labelOf(colour)}
              aria-label={labelOf(colour)}
              aria-pressed={active}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(colour)}
              className={cn('relative grid h-8 w-8 place-items-center rounded-full border transition-shadow', active ? 'border-ink ring-2 ring-ink/80 ring-offset-2 ring-offset-card' : 'border-ink/15')}
              style={{ background: COLOUR_HEX[colour] }}
            >
              {active && <Check size={14} strokeWidth={3} className={['white', 'ivory', 'beige', 'yellow', 'mint', 'silver', 'sky blue', 'peach', 'pink', 'lilac'].includes(colour) ? 'text-ink' : 'text-paper'} />}
            </motion.button>
          );
        })}
      </div>
    </fieldset>
  );
}
