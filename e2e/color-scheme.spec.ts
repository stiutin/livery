import {expect, type Locator, type Page, test} from '@playwright/test';

import {brandToken, trackErrors} from './helpers';

const scheme = (page: Page): Locator => page.getByRole('combobox', {name: 'Colour scheme'});

test('a brand that follows the device is light or dark with it, before any choice', async ({page}) => {
  await page.emulateMedia({colorScheme: 'dark'});
  await page.goto('./harbour/en');
  expect(await brandToken(page, '--color-canvas')).toBe('#121110');

  await page.emulateMedia({colorScheme: 'light'});
  expect(await brandToken(page, '--color-canvas')).toBe('#f4f4f2');
  await expect(scheme(page)).toHaveValue('system');
});

test('a dark brand is dark on a light device, and says so in its HTML', async ({page, request}) => {
  const html = await (await request.get('./onyx/en')).text();
  expect(html).toContain('<html lang="en" data-tenant="onyx" data-color-scheme="dark"');

  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('./onyx/en');
  expect(await brandToken(page, '--color-canvas')).toBe('#0c0c10');
  await expect(scheme(page)).toHaveValue('dark');
});

test('a chosen scheme applies at once, across pages, tenants and reloads, without hydration errors', async ({page}) => {
  const errors = trackErrors(page);
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('./onyx/en');

  await scheme(page).selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
  expect(await brandToken(page, '--color-canvas')).toBe('#f6f2ea');

  await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Invoices'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');

  // The head script applies the stored choice before React hydrates the prerendered dark page.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
  await expect(scheme(page)).toHaveValue('light');

  await scheme(page).selectOption('dark');
  await page.goto('./meadow/en');
  expect(await brandToken(page, '--color-canvas')).toBe('#0b1f1b');
  expect(errors).toEqual([]);
});

test('the theme preview lists both sets of colours', async ({page}) => {
  await page.goto('./harbour/en/theme/preview');
  const canvas = page.getByRole('table', {name: 'Semantic colours of harbour'}).getByRole('row', {name: /^canvas /});
  await expect(canvas).toContainText('#f4f4f2');
  await expect(canvas).toContainText('#121110');
});
