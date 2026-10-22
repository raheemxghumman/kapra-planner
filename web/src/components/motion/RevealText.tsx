import { motion } from 'motion/react';
import type { ElementType } from 'react';
import { cn } from '../../utils/format';

interface RevealTextProps {
  /** Words wrapped in *asterisks* are set in italic serif, e.g. "Plan it. *Try it.*" */
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** Animate when scrolled into view instead of on mount. */
  onScroll?: boolean;
}

/**
 * Each word slides up from behind a mask, one after another, like a printed headline
 * being revealed. Screen readers get the plain sentence once (aria-label).
 */
export function RevealText({ text, as: Tag = 'h2', className, delay = 0, onScroll = false }: RevealTextProps) {
  const words = text.split(' ');
  const trigger = onScroll
    ? { whileInView: 'shown', viewport: { once: true, margin: '-15% 0px' } }
    : { animate: 'shown' };

  return (
    <Tag className={className} aria-label={text.replace(/\*/g, '')}>
      <motion.span
        initial="hidden"
        {...trigger}
        transition={{ staggerChildren: 0.06, delayChildren: delay }}
        className="inline"
        aria-hidden
      >
        {words.map((word, index) => {
          const italic = word.startsWith('*');
          const clean = word.replace(/\*/g, '');
          return (
            <span key={`${word}-${index}`} className="inline-block overflow-hidden pb-[0.12em] align-top">
              <motion.span
                // Italic letters lean past their box; a little right padding stops the mask clipping them.
                className={cn('inline-block', italic && 'pr-[0.06em] font-logo italic')}
                variants={{ hidden: { y: '110%' }, shown: { y: '0%' } }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {clean}
                {index < words.length - 1 && ' '}
              </motion.span>
            </span>
          );
        })}
      </motion.span>
    </Tag>
  );
}
