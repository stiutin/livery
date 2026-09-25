import React from 'react';

import type {Currency, Locale} from '../constants/common.const';
import type {BrandId} from '../theme/themeRegistry';

export interface TenantContextValue {
  brandId: BrandId;
  locale: Locale;
  currency: Currency;
}

export const TenantContext = React.createContext<TenantContextValue | null>(null);
