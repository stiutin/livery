import {expect, test} from '@playwright/test';

import {brandToken, trackErrors} from './helpers';

test('the home page boots without errors', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./');

  await expect(page).toHaveTitle('Livery');
  await expect(page.getByRole('heading', {level: 1, name: 'Welcome'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('switching the tenant rebrands the page and keeps the tenant across navigation', async ({page}) => {
  await page.goto('./');

  await page.getByLabel('Tenant', {exact: true}).selectOption('tenant-alpha');
  await expect(page).toHaveURL(/brand=tenant-alpha/);
  await expect.poll(() => brandToken(page, '--color-brand-default')).toBe('#5b21b6');

  await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Login'}).click();
  await expect(page.getByRole('heading', {level: 1, name: 'Login'})).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login\?.*brand=tenant-alpha/);
  expect(await brandToken(page, '--color-brand-default')).toBe('#5b21b6');
});

test('a deep link opens the right page with its tenant', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./account/billing?brand=tenant-beta&locale=en-GB&currency=GBP');

  await expect(page.getByRole('heading', {level: 1, name: 'Billing'})).toBeVisible();
  await expect(page.getByLabel('Billing amount (GBP)')).toBeVisible();
  await expect.poll(() => brandToken(page, '--color-brand-default')).toBe('#0f766e');
  expect(errors).toEqual([]);
});

test('an unknown path falls back to the home page', async ({page}) => {
  await page.goto('./no-such-page?brand=tenant-alpha');

  await expect(page.getByRole('heading', {level: 1, name: 'Welcome'})).toBeVisible();
});

test('the theme preview lists the colours compiled for the tenant', async ({page}) => {
  await page.goto('./theme/preview?brand=tenant-beta');

  await expect(page.locator('html')).toHaveAttribute('data-tenant', 'tenant-beta');
  const swatches = page.getByRole('list', {name: 'Colour tokens'}).getByRole('listitem');
  await expect(swatches).toHaveCount(18);
  await expect(swatches.filter({hasText: 'brand.default'})).toContainText('#0f766e');
});

test('an unknown brand falls back to the default tenant', async ({page}) => {
  await page.goto('./?brand=nobody');

  await expect(page.locator('html')).toHaveAttribute('data-tenant', 'tenant-default');
  expect(await brandToken(page, '--color-brand-default')).toBe('#2563eb');
});
