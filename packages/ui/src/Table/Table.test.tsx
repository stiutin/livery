import {render, screen, within} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Table, type TableColumn} from './Table';

interface Invoice {
  id: string;
  amount: string;
}

const columns: TableColumn<Invoice>[] = [
  {key: 'id', header: 'Invoice', cell: (row) => row.id},
  {key: 'amount', header: 'Amount', cell: (row) => row.amount, align: 'end'},
];

describe('Table', () => {
  it('is a captioned table with column headers, in a scroll region named after it', () => {
    render(
      <Table
        caption="Recent invoices"
        columns={columns}
        rows={[{id: 'INV-1', amount: '£49.99'}]}
        rowKey={(row) => row.id}
      />
    );
    const table = screen.getByRole('table', {name: 'Recent invoices'});
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent)
    ).toEqual(['Invoice', 'Amount']);
    expect(within(table).getByRole('cell', {name: '£49.99'})).toHaveAttribute('data-align', 'end');

    const region = screen.getByRole('region', {name: 'Recent invoices'});
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('shows the empty message across every column', () => {
    render(
      <Table caption="Recent invoices" columns={columns} rows={[]} rowKey={(row) => row.id} empty="No invoices yet" />
    );
    expect(screen.getByRole('cell', {name: 'No invoices yet'})).toHaveAttribute('colspan', '2');
  });
});
