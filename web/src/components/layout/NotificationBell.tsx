import { Bell, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useRealtime } from '../../hooks/useRealtime';
import { cn } from '../../utils/format';
import { timeAgo } from '../../utils/time';

/** Bell with the unread count; opens a list of recent notifications that update live. */
export function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { notifications, unread, markRead, markAllRead, connected } = useRealtime();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => ref.current && !ref.current.contains(event.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-hairline bg-card transition-colors hover:border-ink"
      >
        <motion.span key={unread} animate={unread ? { rotate: [0, -14, 12, -8, 0] } : undefined} transition={{ duration: 0.6 }}>
          <Bell size={17} strokeWidth={1.7} />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-henna px-1 text-[10px] font-semibold text-paper"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-hairline bg-card shadow-[0_30px_70px_-30px_rgba(43,41,38,0.55)]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            <header className="flex items-center justify-between border-b border-hairline/70 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Notifications</p>
                <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-olive' : 'bg-stone')} title={connected ? 'Live' : 'Offline'} />
              </div>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs text-muted hover:text-ink">
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </header>
            <ul data-lenis-prevent className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">Nothing yet. Updates appear here live.</li>}
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(notification);
                      setOpen(false);
                      if (notification.link) navigate(notification.link);
                    }}
                    className="flex w-full gap-3 border-b border-hairline/50 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-paper"
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', notification.readAt ? 'bg-transparent' : 'bg-henna')} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug font-semibold">{notification.title}</span>
                      {notification.body && <span className="mt-0.5 block truncate text-sm text-muted">{notification.body}</span>}
                      <span className="mt-1 block text-[11px] text-stone">{timeAgo(notification.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
