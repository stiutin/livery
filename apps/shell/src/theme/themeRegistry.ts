import {BrandButton as AlphaBrandButton, BrandCard as AlphaBrandCard} from 'theme-tenant-alpha';
import {BrandButton as BetaBrandButton, BrandCard as BetaBrandCard} from 'theme-tenant-beta';

import type {ThemeModule} from './themeContracts';
import {BrandButton as ShellBrandButton, BrandCard as ShellBrandCard} from './themeFallback';

export interface ResolvedTheme {
  /** The folder in tenants/ whose compiled tokens style the page, applied as <html data-tenant>. */
  tokenSet: string;
  themeModule: ThemeModule;
}

export const SUPPORTED_BRANDS = ['tenant-alpha', 'tenant-beta', 'tenant-empty', 'tenant-default'] as const;
export type BrandId = (typeof SUPPORTED_BRANDS)[number];

const FALLBACK_THEME: ResolvedTheme = {
  tokenSet: 'tenant-default',
  themeModule: {
    BrandButton: ShellBrandButton,
    BrandCard: ShellBrandCard,
  },
};

const THEME_REGISTRY: Readonly<Record<BrandId, ResolvedTheme>> = {
  'tenant-alpha': {
    tokenSet: 'tenant-alpha',
    themeModule: {
      BrandButton: AlphaBrandButton,
      BrandCard: AlphaBrandCard,
    },
  },
  'tenant-beta': {
    tokenSet: 'tenant-beta',
    themeModule: {
      BrandButton: BetaBrandButton,
      BrandCard: BetaBrandCard,
    },
  },
  // Only the billing mock treats this brand differently; it looks like the default.
  'tenant-empty': FALLBACK_THEME,
  'tenant-default': FALLBACK_THEME,
};

export function resolveThemeForBrand(brandId: string): ResolvedTheme {
  const brand = SUPPORTED_BRANDS.find((id) => id === brandId);
  return brand ? THEME_REGISTRY[brand] : FALLBACK_THEME;
}
