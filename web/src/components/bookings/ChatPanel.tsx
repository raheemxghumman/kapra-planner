import { Check, CheckCheck, SendHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { listMessages, markMessagesRead, sendMessage } from '../../api/bookings.api';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { useToast } from '../../hooks/useToast';
import type { ChatMessage } from '../../types/bookings';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/format';
import { formatTime } from '../../utils/time';

/**
 * Live chat for one booking. New messages arrive over Socket.IO; opening the chat marks the
 * other person's messages as read, and both sides see the ticks change.
 */
export function ChatPanel({ bookingId, otherName, open }: { bookingId: string; otherName: string; open: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    listMessages(bookingId, controller.signal)
      .then((loaded) => {
        setMessages(loaded);
        if (loaded.some((message) => message.senderId !== user?.id && !message.readAt)) markMessagesRead(bookingId).catch(() => undefined);
      })
      .catch(() => setMessages([]));
    return () => controller.abort();
  }, [bookingId, user?.id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages?.length]);

  useRealtimeEvent<ChatMessage>('message', (message) => {
    if (message.bookingId !== bookingId) return;
    setMessages((current) => (current?.some((item) => item.id === message.id) ? current : [...(current ?? []), message]));
    if (message.senderId !== user?.id) markMessagesRead(bookingId).catch(() => undefined);
  });
  useRealtimeEvent<{ bookingId: string; readerId: string }>('messages.read', (event) => {
    if (event.bookingId !== bookingId || event.readerId === user?.id) return;
    const now = new Date().toISOString();
    setMessages((current) => current?.map((message) => (message.senderId === user?.id && !message.readAt ? { ...message, readAt: now } : message)) ?? null);
  });

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const message = await sendMessage(bookingId, body);
      setMessages((current) => (current?.some((item) => item.id === message.id) ? current : [...(current ?? []), message]));
      setText('');
    } catch (error) {
      toast({ title: getErrorMessage(error), tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-[22px] border border-hairline bg-card">
      <header className="flex items-center justify-between border-b border-hairline/70 px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold">{otherName}</p>
          <p className="text-xs text-muted">Chat about this booking</p>
        </div>
      </header>
      <div data-lenis-prevent className="flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,rgba(43,41,38,0.06)_1px,transparent_0)] [background-size:18px_18px] px-4 py-4">
        {messages === null && <p className="text-center text-sm text-muted">Loading…</p>}
        {messages?.length === 0 && (
          <p className="mx-auto mt-10 max-w-[16rem] text-center text-sm text-muted">{open ? `Say salaam to ${otherName.split(' ')[0]}. Ask about fabric, fitting or timing.` : 'Chat opens once the booking is paid.'}</p>
        )}
        <AnimatePresence initial={false}>
          {messages?.map((message) => {
            const mine = message.senderId === user?.id;
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn('flex', mine ? 'justify-end' : 'justify-start')}
              >
                <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed', mine ? 'rounded-br-md bg-ink text-paper' : 'rounded-bl-md border border-hairline bg-paper')}>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p className={cn('mt-0.5 flex items-center justify-end gap-1 text-[10px]', mine ? 'text-paper/60' : 'text-muted')}>
                    {formatTime(message.createdAt)}
                    {mine && (message.readAt ? <CheckCheck size={12} className="text-blush" /> : <Check size={12} />)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottom} />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-hairline/70 p-3"
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={!open}
          maxLength={1000}
          placeholder={open ? 'Write a message' : 'Chat is closed'}
          className="flex-1 rounded-full border border-hairline bg-paper px-4 py-2.5 text-sm outline-none focus:border-olive disabled:opacity-50"
        />
        <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!open || sending || !text.trim()} aria-label="Send" className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper disabled:opacity-40">
          <SendHorizontal size={16} />
        </motion.button>
      </form>
    </div>
  );
}
