import type {TenantContextValue} from '../tenant/TenantContext';

export const PASSWORD_MIN_LENGTH = 6;

/** What pages see when a test renders them without a tenant. */
export const DEFAULT_TENANT: TenantContextValue = {
  brandId: 'harbour',
  name: 'Harbour',
  locale: 'en-GB',
  currency: 'GBP',
  features: {payments: true},
};
