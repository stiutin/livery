/** The pages every tenant has, relative to its home in one language. The router and the prerender list read this. */
export const TENANT_PAGES = ['', 'login', 'account', 'invoices', 'theme/preview'] as const;

/**
 * Every URL to prerender: the landing page, each tenant's root (a redirect to its default language), and each
 * page of each tenant in each language.
 */
export function prerenderPaths(tenantIds: readonly string[], languages: readonly string[]): string[] {
  return [
    '/',
    ...tenantIds.flatMap((id) => [
      `/${id}`,
      ...languages.flatMap((language) =>
        TENANT_PAGES.map((page) => (page ? `/${id}/${language}/${page}` : `/${id}/${language}`))
      ),
    ]),
  ];
}
