import type {ComponentProps} from 'react';

import {cx} from '../cx';
import styles from './Button.module.css';

export interface ButtonProps extends ComponentProps<'button'> {
  /** `primary` for the one main action of a view, `secondary` for the others. */
  variant?: 'primary' | 'secondary';
  /** Shows a spinner, marks the button busy and disables it until the work is done. */
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * A button styled by the `--button-*` tokens. Hover, focus and disabled states are plain CSS; focus shows only
 * for keyboard users (`:focus-visible`). The type defaults to `button`, so it never submits a form by accident.
 */
export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cx(styles.button, fullWidth && styles.fullWidth, className)}
      data-variant={variant}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
