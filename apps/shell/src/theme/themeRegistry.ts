import type {ThemeConfig} from './themeTypes';
import type {ThemeModule} from './themeContracts';
import {BrandCard as ShellBrandCard, BrandButton as ShellBrandButton} from './themeFallback';
import themeConfigAlpha, {BrandButton as AlphaBrandButton, BrandCard as AlphaBrandCard} from 'theme-tenant-alpha';
import themeConfigBeta, {BrandButton as BetaBrandButton, BrandCard as BetaBrandCard} from 'theme-tenant-beta';

export type ResolvedTheme = {
  themeConfig: ThemeConfig;
  themeModule: ThemeModule;
};

export const SUPPORTED_BRANDS = ['tenant-alpha', 'tenant-beta', 'tenant-empty', 'tenant-default'] as const;
export type BrandId = (typeof SUPPORTED_BRANDS)[number];

const FALLBACK_THEME: ResolvedTheme = {
  themeConfig: {
    name: 'fallback',
    tokens: {
      '--brand-primary': '#2563eb',
      '--brand-accent': '#60a5fa',
      '--card-bg': '#fff',
      '--card-border': 'rgba(0,0,0,0.12)',
      '--text': '#0f172a',
    },
  },
  themeModule: {
    BrandButton: ShellBrandButton,
    BrandCard: ShellBrandCard,
  },
};

const THEME_REGISTRY: Readonly<Record<BrandId, ResolvedTheme>> = {
  'tenant-alpha': {
    themeConfig: themeConfigAlpha,
    themeModule: {
      BrandButton: AlphaBrandButton,
      BrandCard: AlphaBrandCard,
    },
  },
  'tenant-beta': {
    themeConfig: themeConfigBeta,
    themeModule: {
      BrandButton: BetaBrandButton,
      BrandCard: BetaBrandCard,
    },
  },
  'tenant-empty': FALLBACK_THEME,
  'tenant-default': FALLBACK_THEME,
};

export function resolveThemeForBrand(brandId: string): ResolvedTheme {
  return THEME_REGISTRY[brandId as BrandId] ?? FALLBACK_THEME;
}

export function getThemeConfigForBrand(brandId: string): ThemeConfig {
  return resolveThemeForBrand(brandId).themeConfig;
}
