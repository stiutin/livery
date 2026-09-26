import AxeBuilder from '@axe-core/playwright';
import {expect, type Page, test} from '@playwright/test';

/** WCAG 2.2 A and AA, the level the token contract holds every tenant to. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const TENANTS = ['harbour', 'onyx', 'meadow'];

async function expectAccessible(page: Page, what: string) {
  const {violations} = await new AxeBuilder({page}).withTags(TAGS).analyze();
  const summary = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? 'n/a'}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
  );
  expect(summary, what).toEqual([]);
}

async function signIn(page: Page, tenant: string, language = 'en') {
  await page.goto(`./${tenant}/${language}/login`);
  await page.locator('input[type=email]').fill('ada@example.com');
  await page.locator('input[type=password]').fill('secret-password');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(new RegExp(`/${tenant}/${language}/account$`));
  await expect(page.locator('main table, main dl').first()).toBeVisible();
}

for (const tenant of TENANTS) {
  test.describe(`${tenant} has no WCAG 2.2 AA violations`, () => {
    test('on its public pages', async ({page}) => {
      for (const path of ['', '/login', '/theme/preview']) {
        await page.goto(`./${tenant}/en${path}`);
        await expectAccessible(page, `${tenant}${path || ' home'}`);
      }
    });

    test('on the login form with errors', async ({page}) => {
      await page.goto(`./${tenant}/en/login?next=account`);
      await page.locator('button[type=submit]').click();
      await expect(page.getByRole('alert').first()).toBeVisible();
      await expectAccessible(page, `${tenant} login errors`);
    });

    test('on the account and invoices, and in the payment dialog', async ({page}) => {
      await signIn(page, tenant);
      await expectAccessible(page, `${tenant} account`);

      await page.goto(`./${tenant}/en/invoices`);
      await expect(page.getByRole('table')).toBeVisible();
      await expectAccessible(page, `${tenant} invoices`);

      const pay = page.getByRole('button', {name: /^Pay [A-Z]{3}-/}).first();
      if (await pay.isVisible()) {
        await pay.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expectAccessible(page, `${tenant} payment dialog`);
      }
    });

    test('in German and Spanish', async ({page}) => {
      for (const language of ['de', 'es']) {
        await page.goto(`./${tenant}/${language}`);
        await expectAccessible(page, `${tenant} ${language}`);
      }
    });
  });
}

test('the landing page, Studio and the 404 page have no WCAG 2.2 AA violations', async ({page}) => {
  await page.goto('./');
  await expectAccessible(page, 'landing');
  await page.goto('./studio');
  await expect(page.locator('[data-studio-preview] h1')).toBeVisible();
  await expectAccessible(page, 'studio');
  await page.goto('./nobody/en');
  await expect(page.getByRole('heading', {level: 1, name: 'Page not found'})).toBeVisible();
  await expectAccessible(page, '404');
});
