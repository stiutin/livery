import {data, type LoaderFunctionArgs, redirect} from 'react-router';
import {loadTenant} from 'virtual:livery/tenants';

import {defaultLanguage} from '../i18n/languages';

/** A tenant's bare address sends visitors to its default language, from the locale in its tenant.json. */
export async function loader({params}: LoaderFunctionArgs) {
  const tenant = await loadTenant(params.tenant ?? '');
  if (!tenant) {
    throw data(null, {status: 404});
  }
  return redirect(`/${tenant.id}/${defaultLanguage(tenant.locale)}`);
}

export default function TenantRoot() {
  return null;
}
