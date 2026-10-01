import type {ColorScheme} from '@livery/tokens';
import {Select} from '@livery/ui';
import type {ReactNode} from 'react';
import {Link, NavLink, Outlet, useNavigate} from 'react-router';

import {useSchemeChoice} from '../../colorScheme/colorScheme';
import {LANGUAGE_CODES, LANGUAGES} from '../../i18n/languages';
import {useI18n} from '../../i18n/useI18n';
import {useSession} from '../../session/useSession';
import {usePaths} from '../../tenant/usePaths';
import {useTenant} from '../../tenant/useTenant';
import TenantNavLink from '../TenantNavLink/TenantNavLink';
import styles from './AppLayout.module.css';

const SCHEMES: readonly ColorScheme[] = ['system', 'light', 'dark'];

export function AppLayout(): ReactNode {
  const {name, colorScheme: brandScheme} = useTenant();
  const {language, t} = useI18n();
  const {page, inLanguage} = usePaths();
  const {session, signOut} = useSession();
  const [schemeChoice, chooseScheme] = useSchemeChoice();
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
        <div className={styles.preferences}>
          <Select
            className={styles.scheme}
            aria-label={t('theme.label')}
            value={schemeChoice ?? brandScheme}
            onChange={(event) => {
              const next = SCHEMES.find((scheme) => scheme === event.target.value);
              if (next) {
                chooseScheme(next);
              }
            }}
          >
            {SCHEMES.map((scheme) => (
              <option key={scheme} value={scheme}>
                {t(`theme.${scheme}`)}
              </option>
            ))}
          </Select>
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
        </div>
      </header>

      <main className={styles.shellMain} id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
