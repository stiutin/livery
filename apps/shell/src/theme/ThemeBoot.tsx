import React from "react";
import { useLocation } from "react-router";
import {
  TenantProvider,
  type TenantContextValue,
} from "../tenant/TenantContext";
import { ThemeLoader } from "./ThemeLoader";
import { getThemeConfigForBrand, SUPPORTED_BRANDS } from "./themeRegistry";
import {
  DEFAULT_TENANT,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
} from "../constants/common.const";

function ensureSupported<T extends readonly string[]>(
  value: string | null,
  supported: T,
  fallback: T[number],
): T[number] {
  if (value && supported.includes(value as unknown as T[number])) {
    return value as T[number];
  }
  return fallback;
}

export function ThemeBoot({ children }: { children: React.ReactNode }) {
  const { search } = useLocation();
  const params = React.useMemo(() => new URLSearchParams(search), [search]);

  const brandId = ensureSupported(
    params.get("brand"),
    SUPPORTED_BRANDS,
    DEFAULT_TENANT.brandId,
  );
  const locale = ensureSupported(
    params.get("locale"),
    SUPPORTED_LOCALES,
    DEFAULT_TENANT.locale,
  );
  const currency = ensureSupported(
    params.get("currency"),
    SUPPORTED_CURRENCIES,
    DEFAULT_TENANT.currency,
  );

  const tenant: TenantContextValue = React.useMemo(
    () => ({ brandId, locale, currency }),
    [brandId, locale, currency],
  );
  const themeConfig = getThemeConfigForBrand(tenant.brandId);

  return (
    <TenantProvider value={tenant}>
      <ThemeLoader themeConfig={themeConfig} />
      {children}
    </TenantProvider>
  );
}
