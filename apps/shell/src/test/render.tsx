import {ToastProvider} from '@livery/ui';
import {render} from '@testing-library/react';
import type {ReactNode} from 'react';
import {MemoryRouter, Route, Routes} from 'react-router';

import type {Session} from '../api/types';
import {DEFAULT_TENANT} from '../constants/common.const';
import {SessionProvider} from '../session/SessionContext';
import {type TenantContextValue, TenantProvider} from '../tenant/TenantContext';

interface Options {
  path: string;
  tenant?: Partial<TenantContextValue>;
  /** Signs in before rendering, as if the customer had come back to the page. */
  session?: Session;
  /** Extra routes, to see where the page navigates. */
  routes?: Record<string, ReactNode>;
}

/** Renders a page the way the tenant route does: tenant, session and toasts around it, inside a router. */
export function renderPage(page: ReactNode, {path, tenant = {}, session, routes = {}}: Options) {
  const value = {...DEFAULT_TENANT, ...tenant};
  if (session) {
    sessionStorage.setItem(`livery:session:${value.brandId}`, JSON.stringify(session));
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TenantProvider value={value}>
        <SessionProvider tenant={value.brandId}>
          <ToastProvider>
            <Routes>
              <Route path={path.split('?')[0]} element={page} />
              {Object.entries(routes).map(([routePath, element]) => (
                <Route key={routePath} path={routePath} element={element} />
              ))}
            </Routes>
          </ToastProvider>
        </SessionProvider>
      </TenantProvider>
    </MemoryRouter>
  );
}

/** A session for the mock API, as the login page would store it. */
export function sessionFor(email: string, tenant = DEFAULT_TENANT.brandId): Session {
  return {token: btoa(JSON.stringify({tenant, email})), name: email.split('@')[0] ?? email, email};
}
