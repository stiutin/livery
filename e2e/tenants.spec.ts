import {expect, test} from '@playwright/test';

import {brandToken, trackErrors} from './helpers';

test('the landing page lists every tenant and hydrates without errors', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./');

  await expect(page).toHaveTitle('Livery');
  await expect(page.locator('html')).toHaveAttribute('data-tenant', 'harbour');
  const tenants = page.getByRole('list').getByRole('link');
  await expect(tenants).toHaveText(['Harbour', 'Meadow', 'Onyx']);
  expect(errors).toEqual([]);
});

test('every tenant page is prerendered with its own tokens', async ({request}) => {
  for (const [path, tenant, brand] of [
    ['harbour/en', 'harbour', '#1c1917'],
    ['onyx/es/login', 'onyx', '#d4a94a'],
    ['meadow/de/invoices', 'meadow', '#0f766e'],
    ['onyx/en/theme/preview', 'onyx', '#d4a94a'],
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
    await page.goto('./meadow/en/login');

    await expect(page.getByRole('heading', {level: 1, name: 'Sign in to Meadow'})).toBeVisible();
    expect(await brandToken(page, '--color-brand-default')).toBe('#0f766e');
  });
});

test('links stay inside the tenant', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./onyx/en');

  await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Invoices'}).click();
  // Signed out, so the invoices page hands over to the login page and remembers where to return.
  await expect(page).toHaveURL(/\/onyx\/en\/login\?next=invoices$/);
  await expect(page.getByRole('heading', {level: 1, name: 'Sign in to Onyx'})).toBeVisible();
  expect(await brandToken(page, '--color-brand-default')).toBe('#d4a94a');
  expect(errors).toEqual([]);
});

test('moving to another tenant restyles the page', async ({page}) => {
  await page.goto('./harbour/en');

  await page.getByRole('link', {name: 'Onyx'}).click();
  await expect(page).toHaveURL(/\/onyx\/en$/);
  await expect(page.getByRole('heading', {level: 1, name: 'Welcome to Onyx'})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-tenant', 'onyx');
  await expect.poll(() => brandToken(page, '--color-canvas')).toBe('#0c0c10');
});

test('an unknown tenant is a 404 in the default look', async ({page}) => {
  const response = await page.goto('./nobody/login');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', {level: 1, name: 'Page not found'})).toBeVisible();
  expect(await brandToken(page, '--color-brand-default')).toBe('#1c1917');
  await page.getByRole('link', {name: 'See all tenants'}).click();
  await expect(page).toHaveTitle('Livery');
});

test('an unknown page of a known tenant is a 404 too', async ({page}) => {
  const response = await page.goto('./onyx/en/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', {level: 1, name: 'Page not found'})).toBeVisible();
});

test('the theme preview lists the colours compiled for the tenant', async ({page}) => {
  await page.goto('./meadow/en/theme/preview');

  const table = page.getByRole('table', {name: 'Semantic colours of meadow'});
  await expect(table.getByRole('row')).toHaveCount(20);
  await expect(table.getByRole('row', {name: /brand\.default/})).toContainText('#0f766e');
});
