import type { AuthResponse, LoginInput, RegisterInput } from '../types/auth';
import { http } from './http';
import { tokenStore } from './tokenStore';

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', input);
  tokenStore.save(data);
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/register', input);
  tokenStore.save(data);
  return data;
}

/** Ends the session on the server (best effort) and always forgets the tokens locally. */
export async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefreshToken();
  tokenStore.clear();
  if (refreshToken) {
    await http.post('/auth/logout', { refreshToken }).catch(() => undefined);
  }
}
