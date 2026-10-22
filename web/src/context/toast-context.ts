import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Optional link shown in the toast, e.g. "View booking". */
  action?: { label: string; to: string };
}

export interface Toast extends ToastInput {
  id: number;
  tone: ToastTone;
}

export interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
