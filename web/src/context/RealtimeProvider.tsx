import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/bookings.api';
import { refreshSession } from '../api/session';
import { tokenStore } from '../api/tokenStore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { AppNotification } from '../types/panels';
import { RealtimeContext, type RealtimeHandler } from './realtime-context';

/**
 * The API's origin, e.g. http://localhost:3000 (Socket.IO is served there, not under /api/v1).
 * In production the API address is relative (/api/v1), so this is the site's own origin.
 */
const SOCKET_URL = new URL(
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  window.location.origin,
).origin;

/**
 * One Socket.IO connection per signed-in user. It carries notifications, chat messages and
 * booking/order updates. Pages listen with subscribe(); the bell reads notifications/unread.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const handlers = useRef(new Map<string, Set<RealtimeHandler>>());
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    listNotifications()
      .then((page) => {
        setNotifications(page.data);
        setUnread(page.unread);
      })
      .catch(() => undefined);

    // `auth` as a function: every (re)connect sends the current access token, not a stale one.
    const socket = io(SOCKET_URL, {
      // WebSocket first; long-polling only if a proxy on the way blocks WebSockets.
      transports: ['websocket', 'polling'],
      auth: (send) => send({ token: tokenStore.getAccessToken() }),
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('auth_error', () => {
      // The access token expired: refresh it, then reconnect with the new one.
      refreshSession()
        .then(() => socket.connect())
        .catch(() => undefined);
    });
    socket.on('notification', (notification: AppNotification) => {
      setNotifications((all) => [notification, ...all].slice(0, 30));
      setUnread((count) => count + 1);
      toast({
        title: notification.title,
        description: notification.body ?? undefined,
        tone: 'info',
        action: notification.link ? { label: 'Open', to: notification.link } : undefined,
      });
    });
    // Forward every other event to whoever subscribed to it.
    socket.onAny((event: string, payload: unknown) => {
      handlers.current.get(event)?.forEach((handler) => handler(payload));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setNotifications([]);
      setUnread(0);
    };
  }, [user, toast]);

  const subscribe = useCallback((event: string, handler: RealtimeHandler) => {
    const set = handlers.current.get(event) ?? new Set<RealtimeHandler>();
    set.add(handler);
    handlers.current.set(event, set);
    return () => {
      set.delete(handler);
    };
  }, []);

  const markRead = useCallback((notification: AppNotification) => {
    if (notification.readAt) return;
    const readAt = new Date().toISOString();
    setNotifications((all) =>
      all.map((item) => (item.id === notification.id ? { ...item, readAt } : item)),
    );
    setUnread((count) => Math.max(0, count - 1));
    markNotificationRead(notification.id).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((all) =>
      all.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? new Date().toISOString(),
      })),
    );
    setUnread(0);
    markAllNotificationsRead().catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ connected, subscribe, notifications, unread, markRead, markAllRead }),
    [connected, subscribe, notifications, unread, markRead, markAllRead],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
