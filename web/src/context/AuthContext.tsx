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
      .catch(() => {
        tokenStore.clear();
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

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
