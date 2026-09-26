import type {ReactNode} from 'react';
import {Navigate} from 'react-router';

import type {Session} from '../api/types';
import {useI18n} from '../i18n/useI18n';
import {usePaths} from '../tenant/usePaths';
import {useSession} from './useSession';

/** Renders its children with the session, sends signed-out visitors to the login page, and waits in between. */
export function RequireSession({children}: {children: (session: Session) => ReactNode}) {
  const {session} = useSession();
  const {t} = useI18n();
  const {page, current} = usePaths();

  if (session === undefined) {
    return (
      <p className="notice" role="status">
        {t('session.checking')}
      </p>
    );
  }
  if (session === null) {
    // The page to return to, as the tenant's own page name (`account`), not a path: short, and it cannot leave
    // the tenant or keep an old language.
    return <Navigate to={`${page('login')}?next=${current}`} replace />;
  }
  return children(session);
}
