import type {CompiledToken} from '@livery/tokens';
import {ToastProvider} from '@livery/ui';
import {createContext, useContext, useMemo} from 'react';
import {
  createMemoryRouter,
  RouterProvider,
  UNSAFE_FrameworkContext as FrameworkContext,
  UNSAFE_LocationContext as LocationContext,
  UNSAFE_RouteContext as RouteContext,
} from 'react-router';

import {AppLayout} from '../../components/AppLayout/AppLayout';
import {ComponentGallery} from '../../components/ComponentGallery/ComponentGallery';
import {I18nProvider} from '../../i18n/I18nContext';
import type {Language} from '../../i18n/languages';
import type {Messages} from '../../i18n/messages';
import de from '../../i18n/messages/de.json';
import en from '../../i18n/messages/en.json';
import es from '../../i18n/messages/es.json';
import {SessionProvider} from '../../session/SessionContext';
import {TenantProvider} from '../../tenant/TenantContext';
import HomePage from '../HomePage/HomePage';
import LoginPage from '../LoginPage/LoginPage';
import styles from './Studio.module.css';

const CATALOGUES: Record<Language, Messages> = {en, de, es};
/** The tenant id the preview pretends to be; its links stay inside the preview's own router. */
const PREVIEW_ID = 'studio-preview';

export type PreviewPage = 'home' | 'login' | 'components';

/** The brand's tokens, for the gallery page inside the preview's router. */
const PreviewTokens = createContext<{tokens: readonly CompiledToken[]; tokenSet: string}>({tokens: [], tokenSet: ''});

function PreviewGallery() {
  const {tokens, tokenSet} = useContext(PreviewTokens);
  return <ComponentGallery tokens={tokens} tokenSet={tokenSet} />;
}

const ROUTES = [
  {
    path: '/:tenant/:lang',
    element: <AppLayout />,
    children: [
      {index: true, element: <HomePage />},
      {path: 'login', element: <LoginPage />},
      {path: 'components', element: <PreviewGallery />},
      {path: '*', element: <p className="notice">This page is not part of the preview.</p>},
    ],
  },
];

interface Props {
  page: PreviewPage;
  language: Language;
  name: string;
  locale: string;
  currency: string;
  payments: boolean;
  tokens: readonly CompiledToken[];
  tokenSet: string;
}

/**
 * The product's real pages, the same components as every tenant, in the brand being made. The brand's tokens
 * are written as custom properties on the preview's own element, so nothing outside it changes.
 */
export function StudioPreview({page, language, name, locale, currency, payments, tokens, tokenSet}: Props) {
  const css = `[data-studio-preview]{${tokens.map((token) => `${token.cssVariable}:${token.css};`).join('')}}`;
  const start = `/${PREVIEW_ID}/${language}${page === 'home' ? '' : `/${page}`}`;
  const gallery = useMemo(() => ({tokens, tokenSet}), [tokens, tokenSet]);

  return (
    <div data-studio-preview className={styles.preview}>
      {/* Generated from the settings by the same compiler as the build, not from user-written CSS. */}
      <style dangerouslySetInnerHTML={{__html: css}} />
      <I18nProvider language={language} locale={locale} messages={CATALOGUES[language]}>
        <TenantProvider value={{brandId: PREVIEW_ID, name, locale, currency, features: {payments}}}>
          <SessionProvider tenant={PREVIEW_ID}>
            <ToastProvider>
              <PreviewTokens value={gallery}>
                <IsolatedRouter key={start} start={start} />
              </PreviewTokens>
            </ToastProvider>
          </SessionProvider>
        </TenantProvider>
      </I18nProvider>
    </div>
  );
}

/**
 * A memory data router for the preview alone. React Router refuses a router inside another one, and the page's
 * own framework router would otherwise see the preview's links (for prefetching and route discovery). Clearing
 * the contexts it checks, which React Router exports under the UNSAFE_ prefix for cases like this, gives the
 * preview a router of its own: its links move between preview pages and never touch the Studio page's URL.
 */
function IsolatedRouter({start}: {start: string}) {
  const router = useMemo(() => createMemoryRouter(ROUTES, {initialEntries: [start]}), [start]);

  return (
    <FrameworkContext value={undefined}>
      {/* The router checks this context to refuse nesting; null means "no router above". */}
      <LocationContext value={null as never}>
        {/* Without this, the preview's routes would be matched below the Studio route's own path. */}
        <RouteContext value={{outlet: null, matches: [], isDataRoute: false}}>
          <RouterProvider router={router} />
        </RouteContext>
      </LocationContext>
    </FrameworkContext>
  );
}
