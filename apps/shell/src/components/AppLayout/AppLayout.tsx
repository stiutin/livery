import {Link, NavLink, Outlet, useNavigate} from 'react-router';

import {useSession} from '../../session/useSession';
import {useTenant} from '../../tenant/useTenant';
import TenantNavLink from '../TenantNavLink/TenantNavLink';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const {brandId, name} = useTenant();
  const {session, signOut} = useSession();
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <header className={styles.shellHeader} aria-label="Main header">
        <div className={styles.shellHeaderInner}>
          <NavLink to={`/${brandId}`} end className={styles.shellLogo} aria-label={`${name} home`}>
            {name}
          </NavLink>
          <nav className={styles.shellNav} aria-label="Main navigation">
            <TenantNavLink to="account">Account</TenantNavLink>
            <TenantNavLink to="invoices">Invoices</TenantNavLink>
          </nav>
          <div className={styles.shellTenant}>
            {session ? (
              <button
                type="button"
                className={styles.shellTenantBadge}
                onClick={() => {
                  signOut();
                  void navigate(`/${brandId}`);
                }}
              >
                Sign out
              </button>
            ) : (
              <Link to={`/${brandId}/login`} className={styles.shellTenantBadge}>
                Sign in
              </Link>
            )}
            <Link to="/" className={styles.shellTenantMeta}>
              All tenants
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.shellMain} id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
