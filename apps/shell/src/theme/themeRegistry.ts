export const SUPPORTED_BRANDS = ['tenant-alpha', 'tenant-beta', 'tenant-empty', 'tenant-default'] as const;
export type BrandId = (typeof SUPPORTED_BRANDS)[number];

/** Which folder in tenants/ styles each brand. `tenant-empty` differs only in the billing mock. */
const TOKEN_SETS: Readonly<Record<BrandId, string>> = {
  'tenant-alpha': 'tenant-alpha',
  'tenant-beta': 'tenant-beta',
  'tenant-empty': 'tenant-default',
  'tenant-default': 'tenant-default',
};

/** The token set for a brand, applied as <html data-tenant>; unknown brands get the default. */
export function tokenSetForBrand(brandId: string): string {
  const brand = SUPPORTED_BRANDS.find((id) => id === brandId);
  return brand ? TOKEN_SETS[brand] : TOKEN_SETS['tenant-default'];
}
