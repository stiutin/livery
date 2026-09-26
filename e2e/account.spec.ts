import {expect, test} from '@playwright/test';

test('login validates the form, then signs in and opens billing', async ({page}) => {
  await page.goto('./auth/login?brand=tenant-alpha');

  await page.getByRole('button', {name: 'Login'}).click();
  await expect(page.getByRole('alert').first()).toBeVisible();

  await page.getByLabel('Email address').fill('ada@example.com');
  await page.getByLabel('Password').fill('secret-password');
  await page.getByRole('button', {name: 'Login'}).click();

  await expect(page.getByRole('heading', {level: 1, name: 'Billing'})).toBeVisible();
  await expect(page).toHaveURL(/\/account\/billing\?.*brand=tenant-alpha/);
});

test('billing creates an invoice', async ({page}) => {
  await page.goto('./account/billing?brand=tenant-alpha&locale=en-GB&currency=GBP');

  await page.getByLabel('Billing amount (GBP)').fill('49.99');
  await page.getByRole('button', {name: 'Create invoice'}).click();

  // Scoped to the page: the notification region is a status too.
  const receipt = page.getByRole('main').getByRole('status');
  await expect(receipt.getByRole('heading', {name: 'Invoice created'})).toBeVisible();
  await expect(receipt).toContainText('£49.99');
});

test('billing shows the empty state for a tenant without invoices', async ({page}) => {
  await page.goto('./account/billing?brand=tenant-empty');

  await page.getByLabel(/Billing amount/).fill('10');
  await page.getByRole('button', {name: 'Create invoice'}).click();

  await expect(page.getByRole('main').getByRole('status')).toHaveText('No invoice generated for this tenant');
});
