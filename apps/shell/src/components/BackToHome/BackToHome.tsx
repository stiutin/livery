import {Link} from 'react-router';

import {useTenant} from '../../tenant/useTenant';
import styles from './BackToHome.module.css';

export default function BackToHome() {
  const {brandId, name} = useTenant();

  return (
    <div className={styles.backToHome}>
      <Link to={`/${brandId}`}>Back to {name}</Link>
    </div>
  );
}
