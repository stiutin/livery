import {type ComponentProps, type ReactNode, useId} from 'react';

import {cx} from '../cx';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode;
  /** Help under the label, read by screen readers with the checkbox. */
  hint?: ReactNode;
}

/** A native checkbox with its label beside it, in the brand colour. */
export function Checkbox({label, hint, className, id, ...props}: CheckboxProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cx(styles.checkbox, className)}>
      <input {...props} id={inputId} type="checkbox" className={styles.input} aria-describedby={hintId} />
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
