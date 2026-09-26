import {Card} from '@livery/ui';
import {Link} from 'react-router';

import {api} from '../../api/client';
import type {Account, Invoice, Session} from '../../api/types';
import {useApi} from '../../api/useApi';
import {RequireSession} from '../../session/RequireSession';
import {useTenant} from '../../tenant/useTenant';
import {formatDate, formatMoney} from '../../utils/formatters.utils';
import styles from './AccountPage.module.css';

export default function AccountPage() {
  return (
    <div className="page">
      <h1 className="h1">Your account</h1>
      <RequireSession>{(session) => <Overview session={session} />}</RequireSession>
    </div>
  );
}

function Overview({session}: {session: Session}) {
  const {brandId, locale, currency} = useTenant();
  const account = useApi<Account>(`account:${brandId}:${session.token}`, () => api.account(brandId, session.token));
  const invoices = useApi<Invoice[]>(`invoices:${brandId}:${session.token}`, () =>
    api.invoices(brandId, session.token)
  );

  if (account.status === 'loading' || invoices.status === 'loading') {
    return (
      <p className="notice" role="status">
        Loading your account…
      </p>
    );
  }
  if (account.status === 'error' || invoices.status === 'error') {
    return (
      <div className="error" role="alert">
        {account.status === 'error' ? account.message : invoices.status === 'error' ? invoices.message : ''}
      </div>
    );
  }

  const unpaid = invoices.data.filter((invoice) => invoice.status !== 'paid');
  const due = unpaid.reduce((sum, invoice) => sum + invoice.amountMinor, 0);

  return (
    <>
      <Card className={styles.card}>
        <h2 className="h3">{account.data.name}</h2>
        <dl className={styles.facts}>
          <dt>Email</dt>
          <dd>{account.data.email}</dd>
          <dt>Plan</dt>
          <dd>{account.data.plan}</dd>
          <dt>Customer since</dt>
          <dd>{formatDate(account.data.memberSince, locale)}</dd>
        </dl>
      </Card>

      <Card className={styles.card}>
        <h2 className="h3">Balance</h2>
        {unpaid.length === 0 ? (
          <p>Nothing to pay. You are all settled.</p>
        ) : (
          <p>
            <strong className={styles.amount}>{formatMoney(due, currency, locale)}</strong> due on {unpaid.length}{' '}
            {unpaid.length === 1 ? 'invoice' : 'invoices'}.
          </p>
        )}
        <p className={styles.more}>
          <Link to={`/${brandId}/invoices`}>See all invoices</Link>
        </p>
      </Card>
    </>
  );
}
