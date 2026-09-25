import {NavLink, useLocation} from 'react-router';
import styles from './TenantNavLink.module.css';

export default function TenantNavLink({to, children}: {to: string; children: React.ReactNode}) {
  const {search} = useLocation();

  return (
    <NavLink
      to={{pathname: to, search}}
      className={({isActive}) => `${styles.shellNavLink} ${isActive ? styles['shellNavLink--active'] : ''}`}
    >
      {children}
    </NavLink>
  );
}
