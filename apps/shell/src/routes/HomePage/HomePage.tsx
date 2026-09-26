import {Card} from '@livery/ui';
import {Link} from 'react-router';
import {tenants} from 'virtual:livery/tenants';

import {useI18n} from '../../i18n/useI18n';
import {useSession} from '../../session/useSession';
import {usePaths} from '../../tenant/usePaths';
import {useTenant} from '../../tenant/useTenant';
import styles from './HomePage.module.css';

export default function HomePage() {
  const {brandId, name, locale, currency, features} = useTenant();
  const {language, t, rich} = useI18n();
  const {page} = usePaths();
  const {session} = useSession();
  const others = tenants.filter((tenant) => tenant.id !== brandId);

  return (
    <div className="page">
      <h1 className="h1">{t('home.title', {name})}</h1>

      <p className="description">{t('home.intro', {payments: String(features.payments)})}</p>

      <Card className={styles.card}>
        <p>
          {session
            ? rich('home.signedIn', {
                name: session.name,
                b: (chunks) => <strong>{chunks}</strong>,
                link: (chunks) => <Link to={page('account')}>{chunks}</Link>,
              })
            : rich('home.signInPrompt', {link: (chunks) => <Link to={page('login')}>{chunks}</Link>})}
        </p>
      </Card>

      <Card className={styles.card}>
        <h2 className="h3">{t('home.tenant')}</h2>
        <dl className={styles.settings}>
          <dt>{t('home.address')}</dt>
          <dd>
            <code>/{brandId}</code>
          </dd>
          <dt>{t('home.locale')}</dt>
          <dd>{locale}</dd>
          <dt>{t('home.currency')}</dt>
          <dd>{currency}</dd>
          <dt>{t('home.cardPayments')}</dt>
          <dd>{features.payments ? t('home.on') : t('home.off')}</dd>
        </dl>
        <p className={styles.more}>
          <Link to={page('theme/preview')}>{t('home.preview', {name})}</Link>
        </p>
      </Card>

      {others.length > 0 && (
        <Card className={styles.card}>
          <h2 className="h3">{t('home.others')}</h2>
          <ul className={styles.links}>
            {others.map((tenant) => (
              <li key={tenant.id}>
                <Link to={`/${tenant.id}/${language}`}>{tenant.name}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
