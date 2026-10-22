import { isAxiosError } from 'axios';

/** Turns any thrown value into a message we can show to the user. */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
