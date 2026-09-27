import type {LoadedTenant} from '@livery/tokens';
import {ToastProvider} from '@livery/ui';
import type {ReactNode} from 'react';
import {data, type LoaderFunctionArgs, useLoaderData} from 'react-router';
import {loadTenant} from 'virtual:livery/tenants';

import {AppLayout} from '../components/AppLayout/AppLayout';
import {I18nProvider} from '../i18n/I18nContext';
import {formattingLocale, isLanguage, type Language} from '../i18n/languages';
import {loadMessages, type Messages} from '../i18n/messages';
import {useI18n} from '../i18n/useI18n';
import {SessionProvider} from '../session/SessionContext';
import {TenantProvider} from '../tenant/TenantContext';

/**
 * Loads the tenant and the language named by the first two path segments: the tenant's settings, flags, token
 * CSS and tokens, and the language's messages, each from a chunk of its own. It runs at build time for every
 * prerendered page; an unknown tenant or language is a 404.
 */
/** What every page of a tenant reads through `useRouteLoaderData('tenant')`. */
export interface TenantRouteData {
  tenant: LoadedTenant;
  language: Language;
  /** The locale for numbers and dates on this page. */
  locale: string;
  messages: Messages;
}

export async function loader({params}: LoaderFunctionArgs): Promise<TenantRouteData> {
  const tenant = await loadTenant(params.tenant ?? '');
  const language = params.lang;
  if (!tenant || !isLanguage(language)) {
    throw data(null, {status: 404});
  }
  return {tenant, language, locale: formattingLocale(language, tenant.locale), messages: await loadMessages(language)};
}

export default function TenantRoute(): ReactNode {
  const {tenant, language, locale, messages} = useLoaderData<typeof loader>();

  return (
    <I18nProvider language={language} locale={locale} messages={messages}>
      <TenantProvider
        value={{brandId: tenant.id, name: tenant.name, locale, currency: tenant.currency, features: tenant.features}}
      >
        <SessionProvider tenant={tenant.id}>
          <LocalisedToasts>
            <AppLayout />
          </LocalisedToasts>
        </SessionProvider>
      </TenantProvider>
    </I18nProvider>
  );
}

function LocalisedToasts({children}: {children: React.ReactNode}) {
  const {t} = useI18n();
  return (
    <ToastProvider label={t('ui.notifications')} dismissLabel={t('ui.dismiss')}>
      {children}
    </ToastProvider>
  );
}
