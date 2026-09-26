import {type ReactNode, useId} from 'react';

import {cx} from '../cx';
import styles from './Table.module.css';

export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** `end` for numbers, so digits line up. */
  align?: 'start' | 'end';
}

export interface TableProps<Row> {
  /** Names the table for everyone; screen readers announce it with the table. */
  caption: ReactNode;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** Shown in place of the rows when there are none. */
  empty?: ReactNode;
  className?: string;
}

/**
 * A data table with a caption and column headers. It scrolls sideways inside its own region instead of
 * widening the page; the region is focusable and named after the caption, so keyboard users can scroll it too.
 */
export function Table<Row>({caption, columns, rows, rowKey, empty = 'Nothing to show', className}: TableProps<Row>) {
  const captionId = useId();

  return (
    <div className={cx(styles.scroll, className)} role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className={styles.table}>
        <caption id={captionId} className={styles.caption}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" data-align={column.align ?? 'start'}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} data-align={column.align ?? 'start'}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
