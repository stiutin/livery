import {data, type LoaderFunctionArgs, useLoaderData} from 'react-router';
import {loadTenant} from 'virtual:livery/tenants';

import {AppLayout} from '../components/AppLayout/AppLayout';
import {SessionProvider} from '../session/SessionContext';
import {TenantProvider} from '../tenant/TenantContext';

/**
 * Loads the tenant named by the first path segment: its settings, feature flags, the CSS of its token set and
 * its tokens, from a chunk of its own. It runs at build time for every prerendered page; an unknown id is a 404.
 */
export async function loader({params}: LoaderFunctionArgs) {
  const tenant = await loadTenant(params.tenant ?? '');
  if (!tenant) {
    throw data(null, {status: 404});
  }
  return tenant;
}

export default function TenantRoute() {
  const tenant = useLoaderData<typeof loader>();

  return (
    <TenantProvider
      value={{
        brandId: tenant.id,
        name: tenant.name,
        locale: tenant.locale,
        currency: tenant.currency,
        features: tenant.features,
      }}
    >
      <SessionProvider tenant={tenant.id}>
        <AppLayout />
      </SessionProvider>
    </TenantProvider>
  );
}
