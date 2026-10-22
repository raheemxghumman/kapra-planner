import { useContext, useEffect, useRef } from 'react';
import { RealtimeContext, type RealtimeContextValue } from '../context/realtime-context';

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used inside <RealtimeProvider>');
  }
  return context;
}

/**
 * Runs `handler` whenever the server sends `event`, for as long as the component is mounted.
 * The latest handler is kept in a ref, so callers may pass an inline function.
 */
export function useRealtimeEvent<T>(event: string, handler: (payload: T) => void): void {
  const { subscribe } = useRealtime();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => subscribe(event, (payload) => latest.current(payload as T)), [subscribe, event]);
}
