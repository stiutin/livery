import {useLocation} from 'react-router';

import type {Language} from '../i18n/languages';
import {useI18n} from '../i18n/useI18n';
import {useTenant} from './useTenant';

/** Paths inside the current tenant and language, and the current page in another language. */
export function usePaths() {
  const {brandId} = useTenant();
  const {language} = useI18n();
  // Prerendering requests pages with a trailing slash; the browser's URL has none. Both must give the same links.
  const location = useLocation();
  const pathname = location.pathname.replace(/(.)\/$/, '$1');
  const prefix = `/${brandId}/${language}`;

  return {
    /** `page('invoices')` → `/harbour/en/invoices`; `page()` → the tenant's home in this language. */
    page: (page = ''): string => `/${brandId}/${language}${page ? `/${page}` : ''}`,
    /** This page in another language: only the language segment changes, and the query stays. */
    inLanguage: (other: Language): string =>
      `${pathname.replace(/^\/[^/]+\/[^/]+/, `/${brandId}/${other}`)}${location.search}`,
    /** This page's name within the tenant and language: `account` for /harbour/en/account, '' for the home page. */
    current: pathname.startsWith(prefix) ? pathname.slice(prefix.length + 1) : '',
  };
}
