import { motion } from 'motion/react';
import type { RegisterInput } from '../../types/auth';

type SelfRegisterRole = RegisterInput['role'];

const OPTIONS: { role: SelfRegisterRole; title: string; text: string }[] = [
  { role: 'customer', title: 'Customer', text: 'Plan outfits, try them on and get them stitched.' },
  { role: 'brand', title: 'Brand', text: 'List your collection and reach new customers.' },
  { role: 'tailor', title: 'Tailor', text: 'Take stitching orders from nearby customers.' },
];

interface RolePickerProps {
  value: SelfRegisterRole;
  onChange: (role: SelfRegisterRole) => void;
}

/**
 * Three selectable cards that behave like radio buttons (keyboard and screen-reader friendly).
 * The highlight uses a shared layoutId, so Motion slides it smoothly between cards.
 */
export function RolePicker({ value, onChange }: RolePickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        I am joining as
      </legend>
      <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const selected = option.role === value;
          return (
            <button
              key={option.role}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.role)}
              className="relative rounded-xl border border-hairline p-3 text-left transition-colors hover:border-stone"
            >
              {selected && (
                <motion.span
                  layoutId="role-highlight"
                  className="absolute inset-0 rounded-xl border-2 border-olive bg-olive/5"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative block text-sm font-semibold">{option.title}</span>
              <span className="relative mt-1 block text-xs text-muted">{option.text}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
