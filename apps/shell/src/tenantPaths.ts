/** The pages every tenant has, relative to its home. The router and the prerender list both read this. */
export const TENANT_PAGES = ['', 'auth/login', 'account/billing', 'theme/preview'] as const;

/** Every URL to prerender: the landing page, then each page of each tenant. */
export function prerenderPaths(tenantIds: readonly string[]): string[] {
  return ['/', ...tenantIds.flatMap((id) => TENANT_PAGES.map((page) => (page ? `/${id}/${page}` : `/${id}`)))];
}
