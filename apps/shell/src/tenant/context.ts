import React from "react";
import type { BrandId } from "../theme/themeRegistry";
import type { Currency, Locale } from "../constants/common.const";

export type TenantContextValue = {
  brandId: BrandId;
  locale: Locale;
  currency: Currency;
};

export const TenantContext = React.createContext<TenantContextValue | null>(null);
