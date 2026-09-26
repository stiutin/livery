import type {ReactNode} from 'react';
import {Navigate, useLocation} from 'react-router';

import type {Session} from '../api/types';
import {useI18n} from '../i18n/useI18n';
import {usePaths} from '../tenant/usePaths';
import {useSession} from './useSession';

/** Renders its children with the session, sends signed-out visitors to the login page, and waits in between. */
export function RequireSession({children}: {children: (session: Session) => ReactNode}) {
  const {session} = useSession();
  const {t} = useI18n();
  const {page} = usePaths();
  const {pathname} = useLocation();

  if (session === undefined) {
    return (
      <p className="notice" role="status">
        {t('session.checking')}
      </p>
    );
  }
  if (session === null) {
    return <Navigate to={`${page('login')}?next=${encodeURIComponent(pathname)}`} replace />;
  }
  return children(session);
}
