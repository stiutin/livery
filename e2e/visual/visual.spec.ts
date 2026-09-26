import {expect, type Page, test} from '@playwright/test';

/**
 * Visual regression: every tenant × page, compared with committed screenshots. The clock is fixed so the mock
 * invoices always have the same dates; the baselines are made in the Playwright container that CI uses (see
 * .github/workflows/screenshots.yml), since fonts and anti-aliasing differ from machine to machine.
 */
const TENANTS = ['harbour', 'onyx', 'meadow'];
const NOW = new Date('2026-09-26T10:00:00Z');

test.beforeEach(async ({page}) => {
  await page.clock.setFixedTime(NOW);
});

async function signIn(page: Page, tenant: string) {
  await page.goto(`./${tenant}/en/login`);
  await page.locator('input[type=email]').fill('ada@example.com');
  await page.locator('input[type=password]').fill('secret-password');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(new RegExp(`/${tenant}/en/account$`));
}

for (const tenant of TENANTS) {
  test.describe(tenant, () => {
    for (const path of ['', '/login', '/theme/preview']) {
      test(path || '/', async ({page}) => {
        await page.goto(`./${tenant}/en${path}`);
        await expect(page).toHaveScreenshot(`${tenant}${path.replaceAll('/', '-') || '-home'}.png`, {fullPage: true});
      });
    }

    test('/account and /invoices', async ({page}) => {
      await signIn(page, tenant);
      await expect(page.getByRole('heading', {level: 2}).first()).toBeVisible();
      await expect(page).toHaveScreenshot(`${tenant}-account.png`, {fullPage: true});

      await page.goto(`./${tenant}/en/invoices`);
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page).toHaveScreenshot(`${tenant}-invoices.png`, {fullPage: true});
    });
  });
}

test('landing and Studio', async ({page}) => {
  await page.goto('./');
  await expect(page).toHaveScreenshot('landing.png', {fullPage: true});
  await page.goto('./studio');
  await expect(page.locator('[data-studio-preview] h1')).toBeVisible();
  await expect(page).toHaveScreenshot('studio.png', {fullPage: true});
});
