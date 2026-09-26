import './styles/global.css';

import type {ReactNode} from 'react';
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from 'react-router';
import {defaultTenant, loadTenant, tenants} from 'virtual:livery/tenants';

import {isLanguage, LANGUAGE_CODES} from './i18n/languages';
import type {TenantRouteData} from './routes/tenant';

/** The default tenant styles the pages outside any tenant: the landing page and the 404 page. */
export async function loader() {
  const fallback = await loadTenant(defaultTenant);
  if (!fallback) {
    throw new Error(`the default tenant "${defaultTenant}" is missing`);
  }
  return {fallback};
}

export function meta() {
  return [
    {title: 'Livery'},
    {
      name: 'description',
      content:
        'Livery: a white-label React app where a brand is data - design tokens, one component library, many tenants.',
    },
  ];
}

/**
 * The document for every page. The tenant's tokens are inlined as a <style> in the prerendered HTML, so the
 * first frame is already in the tenant's colours, with no script involved; `data-tenant` names the token set.
 */
export function Layout({children}: {children: ReactNode}) {
  const root = useRouteLoaderData<typeof loader>('root');
  const page = useRouteLoaderData<TenantRouteData>('tenant');
  const current = page?.tenant ?? root?.fallback;
  // Prerendering requests pages with a trailing slash; the browser's URL has none. Both must give the same links.
  const pathname = useLocation().pathname.replace(/(.)\/$/, '$1');

  return (
    <html lang={page?.language ?? 'en'} data-tenant={current?.tokenSet}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={`${import.meta.env.BASE_URL}favicon.svg`} />
        <Meta />
        <Links />
        {/* The same page in the other languages, for search engines and assistive tools. */}
        {page &&
          LANGUAGE_CODES.filter((language) => language !== page.language).map((language) => (
            <link
              key={language}
              rel="alternate"
              hrefLang={language}
              href={`${import.meta.env.BASE_URL}${pathname.slice(1).replace(/^([^/]+)\/[^/]+/, `$1/${language}`)}`}
            />
          ))}
        {/* Compiled at build time from the repository's token files, never from user input. */}
        {current && <style id="tenant-tokens" dangerouslySetInnerHTML={{__html: current.css}} />}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

/**
 * Unknown tenants and paths end here, with the 404 that GitHub Pages already sent. An unknown page of a
 * known tenant throws a 404 from the catch-all route. An unknown tenant or language arrives in the client-rendered
 * 404.html with no loader data for its route, so the first two path segments decide.
 */
export function ErrorBoundary() {
  const error = useRouteError();
  const [tenantId, language] = useLocation().pathname.split('/').filter(Boolean);
  const knownPath =
    tenantId === undefined ||
    (tenants.some((tenant) => tenant.id === tenantId) && (language === undefined || isLanguage(language)));
  const notFound = (isRouteErrorResponse(error) && error.status === 404) || !knownPath;

  return (
    <main className="page">
      <h1 className="h1">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p className="description">
        {notFound ? 'There is no tenant or page at this address.' : 'The page could not be shown.'}
      </p>
      <p>
        <Link to="/">See all tenants</Link>
      </p>
    </main>
  );
}
