import { isAxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth.api';
import { onSessionExpired, refreshSession } from '../api/session';
import { tokenStore } from '../api/tokenStore';
import type { LoginInput, RegisterInput, User } from '../types/auth';
import { AuthContext, type AuthStatus } from './auth-context';

/**
 * Holds who is logged in for the whole app (Context API instead of passing props down).
 * On first load it tries to restore the session from the stored refresh token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.getRefreshToken() ? 'loading' : 'anonymous',
  );

  useEffect(() => {
    if (!tokenStore.getRefreshToken()) return;
    refreshSession()
      .then(({ user: restored }) => {
        setUser(restored);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        // Only a 401 means the refresh token is no longer valid. After a rate limit or a
        // network error the token is kept, so the next reload can restore the session.
        if (isAxiosError(error) && error.response?.status === 401) tokenStore.clear();
        setStatus('anonymous');
      });
  }, []);

  // If the API says the session can no longer be renewed, drop to logged-out state.
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('anonymous');
      }),
    [],
  );

  const startSession = useCallback((nextUser: User) => {
    setUser(nextUser);
    setStatus('authenticated');
    return nextUser;
  }, []);

  const login = useCallback(
    async (input: LoginInput) => startSession((await authApi.login(input)).user),
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => startSession((await authApi.register(input)).user),
    [startSession],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const updateUser = useCallback((next: User) => setUser(next), []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, updateUser }),
    [user, status, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
