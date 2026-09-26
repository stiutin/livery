import {index, route, type RouteConfig} from '@react-router/dev/routes';

/**
 * `/` lists the tenants; everything below `/:tenant` belongs to one tenant, whose loader validates the id.
 * The page paths match TENANT_PAGES, which drives prerendering.
 */
export default [
  index('routes/landing.tsx'),
  route(':tenant', 'routes/tenant.tsx', {id: 'tenant'}, [
    index('routes/HomePage/HomePage.tsx'),
    route('login', 'routes/LoginPage/LoginPage.tsx'),
    route('account', 'routes/AccountPage/AccountPage.tsx'),
    route('invoices', 'routes/InvoicesPage/InvoicesPage.tsx'),
    route('theme/preview', 'routes/ThemePreview/ThemePreview.tsx'),
  ]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
