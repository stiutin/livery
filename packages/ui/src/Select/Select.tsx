import type {ComponentProps} from 'react';

import {cx} from '../cx';
import fieldStyles from '../Field/Field.module.css';
import styles from './Select.module.css';

/** A native select styled like Input. Use it inside a Field; pass the options as children. */
export function Select({className, ...props}: ComponentProps<'select'>) {
  return <select {...props} className={cx(fieldStyles.control, styles.select, className)} />;
}
