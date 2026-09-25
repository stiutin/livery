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

export const SWATCHES = [
  {name: 'Primary', var: '--brand-primary'},
  {name: 'Primary variant', var: '--brand-primary-variant'},
  {name: 'Accent', var: '--brand-accent'},
  {name: 'Accent 2', var: '--brand-accent-2'},
  {name: 'Gradient', var: '--brand-gradient'},
  {name: 'Card background', var: '--card-bg'},
  {name: 'Card border', var: '--card-border'},
  {name: 'Text', var: '--text'},
  {name: 'Muted text', var: '--muted'},
  {name: 'Success', var: '--success'},
  {name: 'Info', var: '--info'},
  {name: 'Danger', var: '--danger'},
];
