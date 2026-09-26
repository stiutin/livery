import {expect, test} from '@playwright/test';

import {trackErrors} from './helpers';

const TENANTS = ['harbour', 'onyx', 'meadow'];
const LANGUAGES = ['en', 'de', 'es'];
const PAGES = ['', '/login', '/account', '/invoices', '/theme/preview'];

test('every page of every tenant is prerendered in all three languages', async ({request}) => {
  for (const tenant of TENANTS) {
    for (const language of LANGUAGES) {
      for (const page of PAGES) {
        const path = `./${tenant}/${language}${page}`;
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        const html = await response.text();
        expect(html, path).toContain(`<html lang="${language}" data-tenant="${tenant}">`);
        for (const other of LANGUAGES.filter((code) => code !== language)) {
          expect(html, path).toContain(`hrefLang="${other}"`);
        }
      }
    }
  }
});

test("a tenant's bare address opens its default language", async ({page}) => {
  await page.goto('./meadow');
  await expect(page).toHaveURL(/\/meadow\/de$/);
  await expect(page.getByRole('heading', {level: 1, name: 'Willkommen bei Meadow'})).toBeVisible();

  await page.goto('./onyx');
  await expect(page).toHaveURL(/\/onyx\/en$/);
});

test('the language switcher keeps the page and the session', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./harbour/en/login');
  await page.getByLabel('Email address').fill('ada@example.com');
  await page.getByLabel('Password').fill('secret-password');
  await page.getByRole('button', {name: 'Sign in'}).click();
  await expect(page).toHaveURL(/\/harbour\/en\/account$/);
  await page.goto('./harbour/en/invoices');

  await page.getByRole('navigation', {name: 'Language'}).getByRole('link', {name: 'Español'}).click();
  await expect(page).toHaveURL(/\/harbour\/es\/invoices$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', {level: 1, name: 'Facturas'})).toBeVisible();
  await expect(page.getByText('4 facturas, 2 pendientes.')).toBeVisible();
  // Harbour bills in pounds; Spanish writes them its own way, with a decimal comma and the currency code.
  await expect(page.getByRole('table')).toContainText(/\d+,\d{2}\sGBP/);
  expect(errors).toEqual([]);
});

test('German pages use German plurals, dates and errors', async ({page}) => {
  await page.goto('./meadow/de/login');
  await page.getByLabel('E-Mail-Adresse').fill('ada@example.com');
  await page.getByLabel('Passwort').fill('wrong-password');
  await page.getByRole('button', {name: 'Anmelden'}).click();
  await expect(page.getByRole('alert')).toHaveText('E-Mail-Adresse oder Passwort stimmen nicht.');

  await page.getByLabel('Passwort').fill('secret-password');
  await page.getByRole('button', {name: 'Anmelden'}).click();
  await expect(page).toHaveURL(/\/meadow\/de\/account$/);
  await expect(page.getByText(/offen auf 2 Rechnungen\./)).toBeVisible();
});

test('an unknown language is a 404', async ({page}) => {
  const response = await page.goto('./harbour/fr/invoices');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', {level: 1, name: 'Page not found'})).toBeVisible();
});
