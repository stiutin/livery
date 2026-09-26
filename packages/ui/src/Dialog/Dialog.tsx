import {type ReactNode, useEffect, useId, useRef} from 'react';

import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  /** Called when the dialog asks to close: Escape, the close button or a click on the backdrop. */
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Actions, usually buttons, at the bottom right. */
  footer?: ReactNode;
  /** The label of the close button, for screen readers. */
  closeLabel?: string;
}

/**
 * A modal dialog on the native <dialog> element. The browser traps focus inside it, makes the page behind
 * it inert, closes it on Escape and returns focus to where it was; this component keeps `open` in sync with
 * the element and turns every way of closing into `onClose`.
 */
export function Dialog({open, onClose, title, children, footer, closeLabel = 'Close'}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      // The panel fills the element, so a click that lands on the element itself is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
}
