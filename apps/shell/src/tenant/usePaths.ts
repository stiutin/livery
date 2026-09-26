import {useLocation} from 'react-router';

import type {Language} from '../i18n/languages';
import {useI18n} from '../i18n/useI18n';
import {useTenant} from './useTenant';

/** Paths inside the current tenant and language, and the current page in another language. */
export function usePaths() {
  const {brandId} = useTenant();
  const {language} = useI18n();
  // Prerendering requests pages with a trailing slash; the browser's URL has none. Both must give the same links.
  const pathname = useLocation().pathname.replace(/(.)\/$/, '$1');

  return {
    /** `page('invoices')` → `/harbour/en/invoices`; `page()` → the tenant's home in this language. */
    page: (page = ''): string => `/${brandId}/${language}${page ? `/${page}` : ''}`,
    /** This page in another language: only the language segment changes. */
    inLanguage: (other: Language): string => pathname.replace(/^\/[^/]+\/[^/]+/, `/${brandId}/${other}`),
  };
}
