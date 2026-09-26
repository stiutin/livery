import './styles/global.css';

import type {LoadedTenant} from '@livery/tokens';
import {ToastProvider} from '@livery/ui';
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
  const current: LoadedTenant | undefined = useRouteLoaderData<LoadedTenant>('tenant') ?? root?.fallback;

  return (
    <html lang={current?.locale ?? 'en'} data-tenant={current?.tokenSet}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={`${import.meta.env.BASE_URL}favicon.svg`} />
        <Meta />
        <Links />
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
  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  );
}

/**
 * Unknown tenants and paths end here, with the 404 that GitHub Pages already sent. An unknown page of a
 * known tenant throws a 404 from the catch-all route. An unknown tenant arrives in the client-rendered 404.html
 * with no loader data for its route, so the first path segment decides.
 */
export function ErrorBoundary() {
  const error = useRouteError();
  const tenantId = useLocation().pathname.split('/').find(Boolean);
  const knownTenant = tenantId === undefined || tenants.some((tenant) => tenant.id === tenantId);
  const notFound = (isRouteErrorResponse(error) && error.status === 404) || !knownTenant;

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
