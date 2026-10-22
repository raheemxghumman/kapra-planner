import { motion } from 'motion/react';
import { Link } from 'react-router';
import type { OutfitItem } from '../../types/stylist';
import { cn, imageUrl, labelOf } from '../../utils/format';

const SLOT_ORDER = ['full_look', 'top', 'bottom', 'outer', 'dupatta', 'shoes', 'accessory'];
const TILT = [-1.6, 2, -1.2, 1.6, -2];

/**
 * A look as a mood board: the main piece (full look or top) large on the left, the rest stacked
 * in a column on the right, each slightly turned like photos laid on a table. Pieces straighten
 * and lift on hover. If more pieces exist than fit, the last tile shows "+N".
 */
export function OutfitBoard({
  items,
  compact = false,
  linked = true,
  className,
}: {
  items: OutfitItem[];
  compact?: boolean;
  /** False when the board itself sits inside a link (a link cannot contain links). */
  linked?: boolean;
  className?: string;
}) {
  const ordered = [...items].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  const [main, ...rest] = ordered;
  const rows = compact ? 3 : 4;
  const side = rest.slice(0, rows);
  const hidden = rest.length - side.length;
  if (!main) return null;

  return (
    <div
      className={cn('grid grid-cols-3 gap-2.5', compact ? 'h-56' : 'h-[420px]', className)}
      style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
    >
      <Piece item={main} index={0} compact={compact} linked={linked} className={cn(side.length ? 'col-span-2' : 'col-span-3')} style={{ gridRow: `span ${rows}` }} />
      {side.map((item, index) => (
        <Piece key={item.id} item={item} index={index + 1} compact={compact} linked={linked} badge={index === side.length - 1 && hidden > 0 ? `+${hidden}` : undefined} />
      ))}
    </div>
  );
}

function Piece({
  item,
  index,
  compact,
  linked,
  badge,
  className,
  style,
}: {
  item: OutfitItem;
  index: number;
  compact: boolean;
  linked: boolean;
  badge?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const content = (
    <>
      <img src={imageUrl(item.product.images[0], index === 0 ? 700 : 300)} alt={item.product.title} loading="lazy" className="h-full w-full object-cover" />
      {!compact && (
        <span className="absolute bottom-2 left-2 rounded-full bg-paper/85 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          {labelOf(item.slot)}
        </span>
      )}
      {badge && <span className="absolute inset-0 grid place-items-center bg-ink/55 font-logo text-2xl text-paper italic">{badge}</span>}
    </>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: index === 0 ? 0 : TILT[index % TILT.length] }}
      whileHover={{ rotate: 0, y: -5, scale: 1.03, zIndex: 5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: index * 0.07 }}
      className={cn('group relative min-h-0 overflow-hidden rounded-xl bg-sand shadow-[0_14px_30px_-18px_rgba(43,41,38,0.6)]', className)}
      style={style}
    >
      {linked ? (
        <Link to={`/shop/${item.productId}`} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}
