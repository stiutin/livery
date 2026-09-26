import {Card} from '@livery/ui';
import {Link} from 'react-router';
import {tenants} from 'virtual:livery/tenants';

import styles from './landing.module.css';

/** The site's front door: every tenant, each a link to its own branded app. */
export default function Landing() {
  return (
    <main className="page">
      <h1 className="h1">Livery</h1>
      <p className="description">
        One customer account, one component library, one set of pages. Each tenant below is only a token file and a few
        settings.
      </p>
      <Card className={styles.card}>
        <h2 className="h3">Tenants</h2>
        <ul className={styles.list}>
          {tenants.map((tenant) => (
            <li key={tenant.id}>
              <Link to={`/${tenant.id}`}>{tenant.name}</Link> <code>/{tenant.id}</code>
            </li>
          ))}
        </ul>
      </Card>
      <Card className={styles.card}>
        <h2 className="h3">Make your own</h2>
        <p>
          <Link to="/studio">Open Livery Studio</Link> to build a brand from a colour, check it live and export it as a
          tenant.
        </p>
      </Card>
    </main>
  );
}
