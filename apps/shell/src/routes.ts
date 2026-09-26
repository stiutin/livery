import {index, route, type RouteConfig} from '@react-router/dev/routes';

/**
 * `/` lists the tenants and `/studio` makes new ones. `/:tenant` sends visitors to the tenant's default language. Everything below
 * `/:tenant/:lang` is one tenant in one language; its loader validates both. The page paths match TENANT_PAGES,
 * which drives prerendering.
 */
export default [
  index('routes/landing.tsx'),
  route('studio', 'routes/studio/Studio.tsx'),
  route(':tenant', 'routes/tenant-root.tsx'),
  route(':tenant/:lang', 'routes/tenant.tsx', {id: 'tenant'}, [
    index('routes/HomePage/HomePage.tsx'),
    route('login', 'routes/LoginPage/LoginPage.tsx'),
    route('account', 'routes/AccountPage/AccountPage.tsx'),
    route('invoices', 'routes/InvoicesPage/InvoicesPage.tsx'),
    route('theme/preview', 'routes/ThemePreview/ThemePreview.tsx'),
  ]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
