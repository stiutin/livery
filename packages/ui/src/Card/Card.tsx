import type {ComponentProps} from 'react';

import {cx} from '../cx';
import styles from './Card.module.css';

/** A surface for grouping content, styled by the `--card-*` tokens. */
export function Card({className, ...props}: ComponentProps<'div'>) {
  return <div {...props} className={cx(styles.card, className)} />;
}
