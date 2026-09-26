import type {Page} from '@playwright/test';

/** Collects uncaught errors and console errors for the whole test. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    // Deep links are served through 404.html, so the document itself answers with 404 on purpose.
    if (message.type() === 'error' && !message.text().includes('404')) {
      errors.push(message.text());
    }
  });
  return errors;
}

/** The value a compiled design token has on the page, for the tenant <html data-tenant> selects. */
export function brandToken(page: Page, name: string): Promise<string> {
  return page.evaluate((token) => getComputedStyle(document.documentElement).getPropertyValue(token).trim(), name);
}
