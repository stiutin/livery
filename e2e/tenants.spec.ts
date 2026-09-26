import {expect, test} from '@playwright/test';

import {brandToken, trackErrors} from './helpers';

test('the landing page lists every tenant and hydrates without errors', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./');

  await expect(page).toHaveTitle('Livery');
  await expect(page.locator('html')).toHaveAttribute('data-tenant', 'tenant-default');
  const tenants = page.getByRole('list').getByRole('link');
  await expect(tenants).toHaveText(['Alpha', 'Beta', 'Livery', 'Empty billing (demo)']);
  expect(errors).toEqual([]);
});

test('every tenant page is prerendered with its own tokens', async ({request}) => {
  for (const [path, tenant, brand] of [
    ['tenant-alpha', 'tenant-alpha', '#5b21b6'],
    ['tenant-alpha/auth/login', 'tenant-alpha', '#5b21b6'],
    ['tenant-beta/account/billing', 'tenant-beta', '#0f766e'],
    ['tenant-empty/theme/preview', 'tenant-default', '#2563eb'],
  ] as const) {
    const response = await request.get(`./${path}`);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).toContain(`data-tenant="${tenant}"`);
    expect(html, path).toContain(`--color-brand-default:${brand};`);
  }
});

test.describe('without JavaScript', () => {
  test.use({javaScriptEnabled: false});

  test('a tenant page is already branded and has its content', async ({page}) => {
    await page.goto('./tenant-beta/auth/login');

    await expect(page.getByRole('heading', {level: 1, name: 'Login'})).toBeVisible();
    expect(await brandToken(page, '--color-brand-default')).toBe('#0f766e');
  });
});

test('links stay inside the tenant', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./tenant-alpha');

  await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Login'}).click();
  await expect(page).toHaveURL(/\/tenant-alpha\/auth\/login$/);
  await expect(page.getByRole('heading', {level: 1, name: 'Login'})).toBeVisible();
  expect(await brandToken(page, '--color-brand-default')).toBe('#5b21b6');
  expect(errors).toEqual([]);
});

test('moving to another tenant restyles the page', async ({page}) => {
  await page.goto('./tenant-alpha');

  await page.getByRole('link', {name: 'Beta'}).click();
  await expect(page).toHaveURL(/\/tenant-beta$/);
  await expect(page.getByRole('heading', {level: 1, name: 'Welcome to Beta'})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-tenant', 'tenant-beta');
  await expect.poll(() => brandToken(page, '--color-brand-default')).toBe('#0f766e');
});

test('an unknown tenant is a 404 in the default look', async ({page}) => {
  const response = await page.goto('./nobody/auth/login');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', {level: 1, name: 'Page not found'})).toBeVisible();
  expect(await brandToken(page, '--color-brand-default')).toBe('#2563eb');
  await page.getByRole('link', {name: 'See all tenants'}).click();
  await expect(page).toHaveTitle('Livery');
});

test('an unknown page of a known tenant is a 404 too', async ({page}) => {
  const response = await page.goto('./tenant-alpha/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', {level: 1, name: 'Page not found'})).toBeVisible();
});

test('the theme preview lists the colours compiled for the tenant', async ({page}) => {
  await page.goto('./tenant-beta/theme/preview');

  const table = page.getByRole('table', {name: 'Semantic colours of tenant-beta'});
  await expect(table.getByRole('row')).toHaveCount(20);
  await expect(table.getByRole('row', {name: /brand\.default/})).toContainText('#0f766e');
});
