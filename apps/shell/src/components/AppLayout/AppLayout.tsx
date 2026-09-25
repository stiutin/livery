import {NavLink, Outlet, useLocation} from 'react-router';

import {useTenant} from '../../tenant/useTenant';
import TenantNavLink from '../TenantNavLink/TenantNavLink';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const {brandId, locale, currency} = useTenant();
  const {search} = useLocation();

  return (
    <div className={styles.shell}>
      <header className={styles.shellHeader} aria-label="Main header">
        <div className={styles.shellHeaderInner}>
          <NavLink to={{pathname: '/', search}} className={styles.shellLogo} aria-label="Home">
            Livery
          </NavLink>
          <nav className={styles.shellNav} aria-label="Main navigation">
            <TenantNavLink to="/auth/login">Login</TenantNavLink>
            <TenantNavLink to="/account/billing">Billing</TenantNavLink>
          </nav>
          <div className={styles.shellTenant} aria-label="Active tenant">
            <span className={styles.shellTenantBadge}>{brandId}</span>
            <span className={styles.shellTenantMeta}>{locale}</span>
            <span className={styles.shellTenantMeta}>{currency}</span>
          </div>
        </div>
      </header>

      <main className={styles.shellMain} id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
