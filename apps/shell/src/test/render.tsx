import {ToastProvider} from '@livery/ui';
import {render} from '@testing-library/react';
import type {ReactNode} from 'react';
import {MemoryRouter, Route, Routes} from 'react-router';

import type {Session} from '../api/types';
import {DEFAULT_TENANT} from '../constants/common.const';
import {I18nProvider} from '../i18n/I18nContext';
import type {Language} from '../i18n/languages';
import type {Messages} from '../i18n/messages';
import de from '../i18n/messages/de.json';
import en from '../i18n/messages/en.json';
import es from '../i18n/messages/es.json';
import {SessionProvider} from '../session/SessionContext';
import {type TenantContextValue, TenantProvider} from '../tenant/TenantContext';

interface Options {
  path: string;
  tenant?: Partial<TenantContextValue>;
  /** Signs in before rendering, as if the customer had come back to the page. */
  session?: Session;
  /** Extra routes, to see where the page navigates. */
  routes?: Record<string, ReactNode>;
  language?: Language;
}

const CATALOGUES: Record<Language, Messages> = {en, de, es};

/** Renders a page the way the tenant route does: language, tenant, session and toasts around it, inside a router. */
export function renderPage(page: ReactNode, {path, tenant = {}, session, routes = {}, language = 'en'}: Options) {
  const value = {...DEFAULT_TENANT, ...tenant};
  if (session) {
    sessionStorage.setItem(`livery:session:${value.brandId}`, JSON.stringify(session));
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider language={language} locale={value.locale} messages={CATALOGUES[language]}>
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
      </I18nProvider>
    </MemoryRouter>
  );
}

/** A session for the mock API, as the login page would store it. */
export function sessionFor(email: string, tenant = DEFAULT_TENANT.brandId): Session {
  return {token: btoa(JSON.stringify({tenant, email})), name: email.split('@')[0] ?? email, email};
}
