import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../utils/format';
import { ToastContext, type Toast, type ToastInput } from './toast-context';

const DURATION_MS = 4_500;
const ICON = { success: CheckCircle2, error: XCircle, info: Info };

/** Small messages in the corner ("Saved to your outfits"). They stack and leave by themselves. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((toast) => toast.id !== id)), []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-3), { ...input, id, tone: input.tone ?? 'success' }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon = ICON[item.tone];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="pointer-events-auto flex gap-3 rounded-2xl border border-hairline bg-card/95 p-4 shadow-[0_18px_50px_-20px_rgba(43,41,38,0.45)] backdrop-blur"
              >
                <Icon
                  size={18}
                  className={cn(
                    'mt-0.5 shrink-0',
                    item.tone === 'success' && 'text-olive',
                    item.tone === 'error' && 'text-henna',
                    item.tone === 'info' && 'text-muted',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
                  {item.action && (
                    <Link
                      to={item.action.to}
                      onClick={() => dismiss(item.id)}
                      className="mt-2 inline-block text-sm font-semibold underline underline-offset-4"
                    >
                      {item.action.label}
                    </Link>
                  )}
                </div>
                <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss" className="self-start text-muted hover:text-ink">
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
