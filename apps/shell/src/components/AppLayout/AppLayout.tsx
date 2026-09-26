import {Link, NavLink, Outlet, useNavigate} from 'react-router';

import {LANGUAGE_CODES, LANGUAGES} from '../../i18n/languages';
import {useI18n} from '../../i18n/useI18n';
import {useSession} from '../../session/useSession';
import {usePaths} from '../../tenant/usePaths';
import {useTenant} from '../../tenant/useTenant';
import TenantNavLink from '../TenantNavLink/TenantNavLink';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const {name} = useTenant();
  const {language, t} = useI18n();
  const {page, inLanguage} = usePaths();
  const {session, signOut} = useSession();
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <header className={styles.shellHeader}>
        <div className={styles.shellHeaderInner}>
          <NavLink to={page()} end className={styles.shellLogo} aria-label={t('nav.home', {name})}>
            {name}
          </NavLink>
          <nav className={styles.shellNav} aria-label={t('nav.main')}>
            <TenantNavLink to="account">{t('nav.account')}</TenantNavLink>
            <TenantNavLink to="invoices">{t('nav.invoices')}</TenantNavLink>
          </nav>
          <div className={styles.shellTenant}>
            {session ? (
              <button
                type="button"
                className={styles.shellTenantBadge}
                onClick={() => {
                  signOut();
                  void navigate(page());
                }}
              >
                {t('nav.signOut')}
              </button>
            ) : (
              <Link to={page('login')} className={styles.shellTenantBadge}>
                {t('nav.signIn')}
              </Link>
            )}
            <Link to="/" className={styles.shellTenantMeta}>
              {t('nav.allTenants')}
            </Link>
          </div>
        </div>
        <nav className={styles.languages} aria-label={t('nav.language')}>
          <ul>
            {LANGUAGE_CODES.map((code) => (
              <li key={code}>
                <Link
                  to={inLanguage(code)}
                  lang={code}
                  hrefLang={code}
                  aria-current={code === language ? 'true' : undefined}
                  className={styles.language}
                >
                  {LANGUAGES[code].name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className={styles.shellMain} id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
