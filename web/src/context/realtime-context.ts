import { createContext } from 'react';
import type { AppNotification } from '../types/panels';

export type RealtimeHandler = (payload: unknown) => void;

export interface RealtimeContextValue {
  connected: boolean;
  /** Listen to a server event ("message", "booking.updated" ...). Returns an unsubscribe function. */
  subscribe: (event: string, handler: RealtimeHandler) => () => void;
  notifications: AppNotification[];
  unread: number;
  markRead: (notification: AppNotification) => void;
  markAllRead: () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);
