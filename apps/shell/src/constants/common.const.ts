import type {TenantContextValue} from '../tenant/TenantContext';
import {SUPPORTED_BRANDS} from '../theme/themeRegistry';

export const MAX_AMOUNT = 1_000_000;
export const PASSWORD_MIN_LENGTH = 6;
export const DEFAULT_TENANT: TenantContextValue = {
  brandId: 'tenant-default',
  locale: 'en-US',
  currency: 'USD',
};

export const SUPPORTED_LOCALES = ['en-US', 'en-GB', 'fr-FR', 'de-DE'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'EUR'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const TENANT_OPTIONS = {
  brands: SUPPORTED_BRANDS,
  locales: SUPPORTED_LOCALES,
  currencies: SUPPORTED_CURRENCIES,
} as const;
