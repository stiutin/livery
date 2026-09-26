import {Card} from '@livery/ui';
import {Link} from 'react-router';
import {tenants} from 'virtual:livery/tenants';

import {useSession} from '../../session/useSession';
import {useTenant} from '../../tenant/useTenant';
import styles from './HomePage.module.css';

export default function HomePage() {
  const {brandId, name, locale, currency, features} = useTenant();
  const {session} = useSession();
  const others = tenants.filter((tenant) => tenant.id !== brandId);

  return (
    <div className="page">
      <h1 className="h1">Welcome to {name}</h1>

      <p className="description">
        Your account, your invoices and {features.payments ? 'card payments' : 'bank transfer details'} in one place.
      </p>

      <Card className={styles.card}>
        {session ? (
          <p>
            Signed in as <strong>{session.name}</strong>. <Link to={`/${brandId}/account`}>Open your account</Link>
          </p>
        ) : (
          <p>
            <Link to={`/${brandId}/login`}>Sign in</Link> to see your account and invoices.
          </p>
        )}
      </Card>

      <Card className={styles.card}>
        <h2 className="h3">This tenant</h2>
        <dl className={styles.settings}>
          <dt>Address</dt>
          <dd>
            <code>/{brandId}</code>
          </dd>
          <dt>Locale</dt>
          <dd>{locale}</dd>
          <dt>Currency</dt>
          <dd>{currency}</dd>
          <dt>Card payments</dt>
          <dd>{features.payments ? 'On' : 'Off'}</dd>
        </dl>
        <p className={styles.more}>
          <Link to={`/${brandId}/theme/preview`}>See every component in {name}&apos;s look</Link>
        </p>
      </Card>

      {others.length > 0 && (
        <Card className={styles.card}>
          <h2 className="h3">Other tenants</h2>
          <ul className={styles.links}>
            {others.map((tenant) => (
              <li key={tenant.id}>
                <Link to={`/${tenant.id}`}>{tenant.name}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
