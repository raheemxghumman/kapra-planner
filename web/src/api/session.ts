import axios from 'axios';
import type { AuthResponse } from '../types/auth';
import { tokenStore } from './tokenStore';

/**
 * Separate axios instance without interceptors, used only to refresh the session.
 * If refreshing went through the main instance, a failed refresh could trigger another
 * refresh and loop forever.
 */
const sessionHttp = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 15_000,
});

let refreshInFlight: Promise<AuthResponse> | null = null;
const expiryListeners = new Set<() => void>();

/**
 * Exchanges the stored refresh token for a new pair. Concurrent callers share one request:
 * refresh tokens are single-use, and the server ends all sessions if one is used twice.
 */
export function refreshSession(): Promise<AuthResponse> {
  refreshInFlight ??= (async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) throw new Error('No session to refresh');
    const { data } = await sessionHttp.post<AuthResponse>('/auth/refresh', { refreshToken });
    tokenStore.save(data);
    return data;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** Lets AuthContext react when the session cannot be renewed (e.g. log the user out). */
export function onSessionExpired(listener: () => void): () => void {
  expiryListeners.add(listener);
  return () => expiryListeners.delete(listener);
}

export function notifySessionExpired(): void {
  tokenStore.clear();
  expiryListeners.forEach((listener) => listener());
}
