import {useLocation} from 'react-router';

import type {Language} from '../i18n/languages';
import {useI18n} from '../i18n/useI18n';
import {useTenant} from './useTenant';

export interface TenantPaths {
  /** `page('invoices')` → `/harbour/en/invoices`; `page()` → the tenant's home in this language. */
  page: (page?: string) => string;
  /** This page in another language: only the language segment changes, and the query stays. */
  inLanguage: (other: Language) => string;
  /** This page's name within the tenant and language: `account` for /harbour/en/account, '' for the home page. */
  current: string;
}

/** Paths inside the current tenant and language, and the current page in another language. */
export function usePaths(): TenantPaths {
  const {brandId} = useTenant();
  const {language} = useI18n();
  // Prerendering requests pages with a trailing slash; the browser's URL has none. Both must give the same links.
  const location = useLocation();
  const pathname = location.pathname.replace(/(.)\/$/, '$1');
  const prefix = `/${brandId}/${language}`;

  return {
    page: (page = ''): string => `/${brandId}/${language}${page ? `/${page}` : ''}`,
    inLanguage: (other: Language): string =>
      `${pathname.replace(/^\/[^/]+\/[^/]+/, `/${brandId}/${other}`)}${location.search}`,
    current: pathname.startsWith(prefix) ? pathname.slice(prefix.length + 1) : '',
  };
}
