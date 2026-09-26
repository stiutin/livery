import {Link} from 'react-router';

import {useI18n} from '../../i18n/useI18n';
import {usePaths} from '../../tenant/usePaths';
import {useTenant} from '../../tenant/useTenant';
import styles from './BackToHome.module.css';

export default function BackToHome() {
  const {name} = useTenant();
  const {t} = useI18n();
  const {page} = usePaths();

  return (
    <div className={styles.backToHome}>
      <Link to={page()}>{t('nav.backTo', {name})}</Link>
    </div>
  );
}
