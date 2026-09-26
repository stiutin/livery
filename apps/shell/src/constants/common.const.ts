import type {TenantContextValue} from '../tenant/TenantContext';

export const MAX_AMOUNT = 1_000_000;
export const PASSWORD_MIN_LENGTH = 6;

/** What pages see when a test renders them without a tenant. */
export const DEFAULT_TENANT: TenantContextValue = {
  brandId: 'tenant-default',
  name: 'Livery',
  locale: 'en-US',
  currency: 'USD',
};
