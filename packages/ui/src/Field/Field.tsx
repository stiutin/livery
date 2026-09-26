import {type ComponentProps, type ReactNode, useId} from 'react';

import {cx} from '../cx';
import styles from './Field.module.css';

/** What a control needs to be tied to its label, hint and error. Spread it onto the control. */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

export interface FieldProps {
  label: ReactNode;
  /** Help that is always shown, read by screen readers with the control. */
  hint?: ReactNode;
  /** When set, the control is marked invalid and the message is announced. */
  error?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * A label, a control, an optional hint and an optional error, wired together: the label names the control,
 * the hint and the error describe it, and an error marks it invalid and is announced as it appears.
 */
export function Field({label, hint, error, className, children}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined})}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** A text input styled by the `--input-*` tokens. Use it inside a Field. */
export function Input({className, ...props}: ComponentProps<'input'>) {
  return <input {...props} className={cx(styles.control, className)} />;
}
