import {Card} from '@livery/ui';
import {Link} from 'react-router';

import {api} from '../../api/client';
import type {Account, Invoice, Session} from '../../api/types';
import {useApi} from '../../api/useApi';
import {errorKey} from '../../i18n/errors';
import {useI18n} from '../../i18n/useI18n';
import {RequireSession} from '../../session/RequireSession';
import {usePaths} from '../../tenant/usePaths';
import {useTenant} from '../../tenant/useTenant';
import {formatDate, formatMoney} from '../../utils/formatters.utils';
import styles from './AccountPage.module.css';

export default function AccountPage() {
  const {t} = useI18n();

  return (
    <div className="page">
      <h1 className="h1">{t('account.title')}</h1>
      <RequireSession>{(session) => <Overview session={session} />}</RequireSession>
    </div>
  );
}

function Overview({session}: {session: Session}) {
  const {brandId, locale, currency} = useTenant();
  const {t, rich} = useI18n();
  const {page} = usePaths();
  const account = useApi<Account>(`account:${brandId}:${session.token}`, () => api.account(brandId, session.token));
  const invoices = useApi<Invoice[]>(`invoices:${brandId}:${session.token}`, () =>
    api.invoices(brandId, session.token)
  );

  if (account.status === 'error' || invoices.status === 'error') {
    return (
      <div className="error" role="alert">
        {t(errorKey(account.status === 'error' ? account.error : invoices.status === 'error' ? invoices.error : null))}
      </div>
    );
  }
  if (account.status === 'loading' || invoices.status === 'loading') {
    return (
      <p className="notice" role="status">
        {t('account.loading')}
      </p>
    );
  }

  const unpaid = invoices.data.filter((invoice) => invoice.status !== 'paid');
  const due = unpaid.reduce((sum, invoice) => sum + invoice.amountMinor, 0);

  return (
    <>
      <Card className={styles.card}>
        <h2 className="h3">{account.data.name}</h2>
        <dl className={styles.facts}>
          <dt>{t('account.email')}</dt>
          <dd>{account.data.email}</dd>
          <dt>{t('account.plan')}</dt>
          <dd>{t(`plan.${account.data.plan}`)}</dd>
          <dt>{t('account.since')}</dt>
          <dd>{formatDate(account.data.memberSince, locale)}</dd>
        </dl>
      </Card>

      <Card className={styles.card}>
        <h2 className="h3">{t('account.balance')}</h2>
        <p>
          {unpaid.length === 0
            ? t('account.settled')
            : rich('account.due', {
                amount: formatMoney(due, currency, locale),
                count: unpaid.length,
                b: (chunks) => <strong className={styles.amount}>{chunks}</strong>,
              })}
        </p>
        <p className={styles.more}>
          <Link to={page('invoices')}>{t('account.allInvoices')}</Link>
        </p>
      </Card>
    </>
  );
}
