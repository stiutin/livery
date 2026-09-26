import type {ReactNode} from 'react';
import {Navigate, useLocation} from 'react-router';

import type {Session} from '../api/types';
import {useTenant} from '../tenant/useTenant';
import {useSession} from './useSession';

/** Renders its children with the session, sends signed-out visitors to the login page, and waits in between. */
export function RequireSession({children}: {children: (session: Session) => ReactNode}) {
  const {session} = useSession();
  const {brandId} = useTenant();
  const {pathname} = useLocation();

  if (session === undefined) {
    return (
      <p className="notice" role="status">
        Checking your session…
      </p>
    );
  }
  if (session === null) {
    return <Navigate to={`/${brandId}/login?next=${encodeURIComponent(pathname)}`} replace />;
  }
  return children(session);
}
