import {Button, Card, Table, type TableColumn, useToast} from '@livery/ui';
import {lazy, Suspense, useState} from 'react';

import {api} from '../../api/client';
import type {Invoice, Session} from '../../api/types';
import {useApi} from '../../api/useApi';
import {errorKey} from '../../i18n/errors';
import {useI18n} from '../../i18n/useI18n';
import {RequireSession} from '../../session/RequireSession';
import {useTenant} from '../../tenant/useTenant';
import {formatDate, formatMoney} from '../../utils/formatters.utils';
import styles from './InvoicesPage.module.css';

// Tenants without card payments never download the payment flow.
const PaymentDialog = lazy(() => import('./PaymentDialog'));

export default function InvoicesPage() {
  const {t} = useI18n();

  return (
    <div className="page">
      <h1 className="h1">{t('invoices.title')}</h1>
      <RequireSession>{(session) => <Invoices session={session} />}</RequireSession>
    </div>
  );
}

function Invoices({session}: {session: Session}) {
  const {brandId, locale, currency, features} = useTenant();
  const {t} = useI18n();
  const toast = useToast();
  const invoices = useApi<Invoice[]>(`invoices:${brandId}:${session.token}`, () =>
    api.invoices(brandId, session.token)
  );
  const [paying, setPaying] = useState<Invoice | null>(null);

  if (invoices.status === 'error') {
    return (
      <div className="error" role="alert">
        {t(errorKey(invoices.error))}
      </div>
    );
  }
  if (invoices.status === 'loading') {
    return (
      <p className="notice" role="status">
        {t('invoices.loading')}
      </p>
    );
  }

  const columns: TableColumn<Invoice>[] = [
    {key: 'number', header: t('invoices.number'), cell: (invoice) => invoice.number},
    {key: 'due', header: t('invoices.due'), cell: (invoice) => formatDate(invoice.dueOn, locale)},
    {
      key: 'amount',
      header: t('invoices.amount'),
      align: 'end',
      cell: (invoice) => formatMoney(invoice.amountMinor, currency, locale),
    },
    {
      key: 'status',
      header: t('invoices.status'),
      cell: (invoice) => (
        <span className={styles.status} data-status={invoice.status}>
          {t(`status.${invoice.status}`)}
        </span>
      ),
    },
  ];
  if (features.payments) {
    columns.push({
      key: 'action',
      header: <span className={styles.visuallyHidden}>{t('invoices.action')}</span>,
      align: 'end',
      cell: (invoice) =>
        invoice.status === 'paid' ? null : (
          <Button
            variant="secondary"
            onClick={() => {
              setPaying(invoice);
            }}
            aria-label={t('invoices.payLabel', {number: invoice.number})}
          >
            {t('invoices.pay')}
          </Button>
        ),
    });
  }

  const unpaid = invoices.data.filter((invoice) => invoice.status !== 'paid');

  return (
    <>
      {invoices.data.length > 0 && (
        <p className="description">{t('invoices.summary', {count: invoices.data.length, unpaid: unpaid.length})}</p>
      )}
      {!features.payments && unpaid.length > 0 && (
        <Card className={styles.transfer}>
          <h2 className="h3">{t('invoices.transferTitle')}</h2>
          <p>{t('invoices.transferReference')}</p>
          <dl className={styles.facts}>
            <dt>{t('invoices.holder')}</dt>
            <dd>Livery Demo Ltd</dd>
            <dt>{t('invoices.iban')}</dt>
            <dd>
              <code>DE89 3704 0044 0532 0130 00</code>
            </dd>
          </dl>
        </Card>
      )}

      <Table
        className={styles.table}
        caption={t('invoices.caption')}
        columns={columns}
        rows={invoices.data}
        rowKey={(invoice) => invoice.id}
        empty={t('invoices.empty')}
      />

      {paying && (
        <Suspense fallback={null}>
          <PaymentDialog
            invoice={paying}
            session={session}
            onClose={(paid) => {
              setPaying(null);
              if (paid) {
                toast(t('invoices.paidToast', {number: paid.number}), {tone: 'success'});
                invoices.reload();
              }
            }}
          />
        </Suspense>
      )}
    </>
  );
}
