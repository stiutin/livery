import React from 'react';

/** The tenant a page belongs to, from its tenant.json. */
export interface TenantContextValue {
  /** The tenant id, which is also the first segment of its URLs. */
  brandId: string;
  name: string;
  locale: string;
  currency: string;
}

export const TenantContext = React.createContext<TenantContextValue | null>(null);
