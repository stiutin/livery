import {Button, Card, Table, type TableColumn, useToast} from '@livery/ui';
import {lazy, Suspense, useState} from 'react';

import {api} from '../../api/client';
import type {Invoice, Session} from '../../api/types';
import {useApi} from '../../api/useApi';
import {RequireSession} from '../../session/RequireSession';
import {useTenant} from '../../tenant/useTenant';
import {formatDate, formatMoney} from '../../utils/formatters.utils';
import styles from './InvoicesPage.module.css';

// Tenants without card payments never download the payment flow.
const PaymentDialog = lazy(() => import('./PaymentDialog'));

const STATUS_LABEL: Record<Invoice['status'], string> = {open: 'Open', overdue: 'Overdue', paid: 'Paid'};

export default function InvoicesPage() {
  return (
    <div className="page">
      <h1 className="h1">Invoices</h1>
      <RequireSession>{(session) => <Invoices session={session} />}</RequireSession>
    </div>
  );
}

function Invoices({session}: {session: Session}) {
  const {brandId, locale, currency, features} = useTenant();
  const toast = useToast();
  const invoices = useApi<Invoice[]>(`invoices:${brandId}:${session.token}`, () =>
    api.invoices(brandId, session.token)
  );
  const [paying, setPaying] = useState<Invoice | null>(null);

  if (invoices.status === 'loading') {
    return (
      <p className="notice" role="status">
        Loading invoices…
      </p>
    );
  }
  if (invoices.status === 'error') {
    return (
      <div className="error" role="alert">
        {invoices.message}
      </div>
    );
  }

  const columns: TableColumn<Invoice>[] = [
    {key: 'number', header: 'Invoice', cell: (invoice) => invoice.number},
    {key: 'due', header: 'Due', cell: (invoice) => formatDate(invoice.dueOn, locale)},
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (invoice) => formatMoney(invoice.amountMinor, currency, locale),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (invoice) => (
        <span className={styles.status} data-status={invoice.status}>
          {STATUS_LABEL[invoice.status]}
        </span>
      ),
    },
  ];
  if (features.payments) {
    columns.push({
      key: 'action',
      header: <span className={styles.visuallyHidden}>Action</span>,
      align: 'end',
      cell: (invoice) =>
        invoice.status === 'paid' ? null : (
          <Button
            variant="secondary"
            onClick={() => {
              setPaying(invoice);
            }}
            aria-label={`Pay ${invoice.number}`}
          >
            Pay
          </Button>
        ),
    });
  }

  const unpaid = invoices.data.filter((invoice) => invoice.status !== 'paid');

  return (
    <>
      {!features.payments && unpaid.length > 0 && (
        <Card className={styles.transfer}>
          <h2 className="h3">Pay by bank transfer</h2>
          <p>Use the invoice number as the reference.</p>
          <dl className={styles.facts}>
            <dt>Account holder</dt>
            <dd>Livery Demo Ltd</dd>
            <dt>IBAN</dt>
            <dd>
              <code>DE89 3704 0044 0532 0130 00</code>
            </dd>
          </dl>
        </Card>
      )}

      <Table
        className={styles.table}
        caption="Your invoices, newest first"
        columns={columns}
        rows={invoices.data}
        rowKey={(invoice) => invoice.id}
        empty="No invoices yet."
      />

      {paying && (
        <Suspense fallback={null}>
          <PaymentDialog
            invoice={paying}
            session={session}
            onClose={(paid) => {
              setPaying(null);
              if (paid) {
                toast(`${paid.number} is paid. Thank you.`, {tone: 'success'});
                invoices.reload();
              }
            }}
          />
        </Suspense>
      )}
    </>
  );
}
