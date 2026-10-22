import axios from 'axios';

/**
 * The single axios instance every API call goes through.
 * The base URL comes from VITE_API_URL so the same build works locally and in production.
 * Auth headers and token refresh will be added here as interceptors in week 1.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 15_000,
});
