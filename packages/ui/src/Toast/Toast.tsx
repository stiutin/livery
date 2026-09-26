import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react';

import styles from './Toast.module.css';
import {type ShowToast, ToastContext, type ToastTone} from './useToast';

interface ToastItem {
  id: number;
  message: ReactNode;
  tone: ToastTone;
  duration: number | null;
}

const DEFAULT_DURATION = 6000;

/**
 * Hosts the notification region and lets any component below it show a toast with `useToast()`.
 *
 * The region is in the page from the start, so screen readers announce what is added to it. Toasts pause while
 * the pointer or keyboard focus is inside the region, and errors never leave on their own, so nobody is rushed
 * (WCAG 2.2.1).
 */
export function ToastProvider({
  children,
  label = 'Notifications',
  dismissLabel = 'Dismiss notification',
}: {
  children: ReactNode;
  /** The name of the notification region. */
  label?: string;
  /** The name of each toast's close button. */
  dismissLabel?: string;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>((message, {tone = 'neutral', duration = DEFAULT_DURATION} = {}) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, {id, message, tone, duration: tone === 'danger' ? null : duration}]);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <section
        className={styles.region}
        aria-label={label}
        onPointerEnter={() => {
          setPaused(true);
        }}
        onPointerLeave={() => {
          setPaused(false);
        }}
        onFocus={() => {
          setPaused(true);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPaused(false);
          }
        }}
      >
        {/* The live region is a plain element: a list cannot carry the status role. */}
        <div role="status" aria-live="polite">
          {toasts.length > 0 && (
            <ol className={styles.list}>
              {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} paused={paused} onDismiss={dismiss} dismissLabel={dismissLabel} />
              ))}
            </ol>
          )}
        </div>
      </section>
    </ToastContext>
  );
}

function Toast({
  toast,
  paused,
  onDismiss,
  dismissLabel,
}: {
  toast: ToastItem;
  paused: boolean;
  onDismiss: (id: number) => void;
  dismissLabel: string;
}) {
  const {id, duration} = toast;

  // A pause restarts the full duration afterwards: simpler than tracking the time left, and never shorter.
  useEffect(() => {
    if (duration === null || paused) {
      return undefined;
    }
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, paused, onDismiss]);

  return (
    <li className={styles.toast} data-tone={toast.tone}>
      <p className={styles.message}>{toast.message}</p>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => {
          onDismiss(id);
        }}
        aria-label={dismissLabel}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}
