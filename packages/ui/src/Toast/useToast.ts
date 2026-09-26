import {createContext, type ReactNode, useContext} from 'react';

export type ToastTone = 'neutral' | 'success' | 'danger';

export interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds before a toast leaves on its own. Errors stay until they are dismissed. */
  duration?: number;
}

export type ShowToast = (message: ReactNode, options?: ToastOptions) => void;

export const ToastContext = createContext<ShowToast | null>(null);

/** Shows a toast. Must be called inside a ToastProvider. */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) {
    throw new Error('useToast() needs a <ToastProvider> above it');
  }
  return show;
}
