import {NavLink} from 'react-router';

import {usePaths} from '../../tenant/usePaths';
import styles from './TenantNavLink.module.css';

/** A header link to one of the current tenant's pages, in the current language. */
export default function TenantNavLink({to, children}: {to: string; children: React.ReactNode}) {
  const {page} = usePaths();

  return (
    <NavLink
      to={page(to)}
      className={({isActive}) => `${styles.shellNavLink} ${isActive ? styles['shellNavLink--active'] : ''}`}
    >
      {children}
    </NavLink>
  );
}
