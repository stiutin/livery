import {NavLink} from 'react-router';

import {useTenant} from '../../tenant/useTenant';
import styles from './TenantNavLink.module.css';

/** A header link to one of the current tenant's pages; `to` is relative to the tenant's home. */
export default function TenantNavLink({to, children}: {to: string; children: React.ReactNode}) {
  const {brandId} = useTenant();

  return (
    <NavLink
      to={`/${brandId}/${to}`}
      className={({isActive}) => `${styles.shellNavLink} ${isActive ? styles['shellNavLink--active'] : ''}`}
    >
      {children}
    </NavLink>
  );
}
