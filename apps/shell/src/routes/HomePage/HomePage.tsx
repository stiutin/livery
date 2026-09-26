import {Card} from '@livery/ui';
import {Link} from 'react-router';
import {tenants} from 'virtual:livery/tenants';

import {useTenant} from '../../tenant/useTenant';
import styles from './HomePage.module.css';

export default function HomePage() {
  const {brandId, name, locale, currency} = useTenant();
  const others = tenants.filter((tenant) => tenant.id !== brandId);

  return (
    <div className="page">
      <h1 className="h1">Welcome to {name}</h1>

      <p className="description">
        Every page here is the same code as every other tenant&apos;s; only the tokens and the settings differ.
      </p>

      <Card className={styles.card}>
        <h2 className="h2">This tenant</h2>
        <dl className={styles.settings}>
          <dt>Address</dt>
          <dd>
            <code>/{brandId}</code>
          </dd>
          <dt>Locale</dt>
          <dd>{locale}</dd>
          <dt>Currency</dt>
          <dd>{currency}</dd>
        </dl>
      </Card>

      <Card className={styles.card}>
        <h2 className="h3">Pages</h2>
        <ul className={styles.links}>
          <li>
            <Link to={`/${brandId}/auth/login`}>Login</Link>
          </li>
          <li>
            <Link to={`/${brandId}/account/billing`}>Billing</Link>
          </li>
          <li>
            <Link to={`/${brandId}/theme/preview`}>Theme preview</Link>
          </li>
        </ul>
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
