import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { notifySessionExpired, refreshSession } from './session';
import { tokenStore } from './tokenStore';

/**
 * The single axios instance every API call goes through.
 * The base URL comes from VITE_API_URL so the same build works locally and in production.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 15_000,
});

/** Request interceptor: attach the access token to every call. */
http.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Response interceptor: when a call fails with 401 because the access token expired,
 * refresh the session once and repeat the call. If refreshing fails, the user is logged out.
 */
http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  const isAuthRoute = config?.url?.startsWith('/auth/');

  if (error.response?.status !== 401 || !config || config._retried || isAuthRoute) {
    throw error;
  }

  config._retried = true;
  try {
    await refreshSession();
  } catch {
    notifySessionExpired();
    throw error;
  }
  return http(config);
});
