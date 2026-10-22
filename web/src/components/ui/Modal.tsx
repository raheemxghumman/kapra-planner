import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/format';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Closes on Escape and stops the page behind from scrolling while open. */
function useOverlayBehaviour(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
}

const Backdrop = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 z-[70] bg-ink/35 backdrop-blur-[3px]"
  />
);

/** Centered dialog that rises in with a soft spring. */
export function Modal({ open, onClose, title, description, children, footer, className }: OverlayProps) {
  const titleId = useId();
  useOverlayBehaviour(open, onClose);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClose={onClose} />
          <div className="pointer-events-none fixed inset-0 z-[71] grid place-items-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className={cn(
                'pointer-events-auto flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-[26px] border border-hairline bg-card shadow-[0_40px_90px_-30px_rgba(43,41,38,0.55)]',
                className,
              )}
            >
              <header className="flex items-start justify-between gap-4 border-b border-hairline/70 px-6 py-5">
                <div>
                  <h2 id={titleId} className="text-xl leading-tight">
                    {title}
                  </h2>
                  {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-ink">
                  <X size={18} />
                </button>
              </header>
              <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-5">
                {children}
              </div>
              {footer && <footer className="flex justify-end gap-2 border-t border-hairline/70 px-6 py-4">{footer}</footer>}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Panel that slides in from the right (cart, filters, swaps). */
export function Sheet({ open, onClose, title, description, children, footer, className }: OverlayProps) {
  const titleId = useId();
  useOverlayBehaviour(open, onClose);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClose={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className={cn(
              'fixed top-0 right-0 bottom-0 z-[71] flex w-full max-w-md flex-col border-l border-hairline bg-paper shadow-[-30px_0_80px_-40px_rgba(43,41,38,0.5)]',
              className,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
              <div>
                <h2 id={titleId} className="text-xl leading-tight">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-ink">
                <X size={18} />
              </button>
            </header>
            <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>
            {footer && <footer className="border-t border-hairline px-6 py-4">{footer}</footer>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
