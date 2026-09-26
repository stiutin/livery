import {expect, type Page, test} from '@playwright/test';

import {brandToken} from './helpers';

const notifications = (page: Page) => page.getByRole('region', {name: 'Notifications'}).getByRole('status');

test.beforeEach(async ({page}) => {
  await page.goto('./harbour/en/theme/preview');
});

test('the dialog opens from the keyboard, closes on Escape and gives focus back', async ({page, isMobile}) => {
  test.skip(isMobile, 'keyboard');
  const opener = page.getByRole('button', {name: 'Open dialog'});
  await opener.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', {name: 'Cancel the subscription?'});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('You keep access until the end of the billing period.');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('the dialog closes from its own actions and confirms with a notification', async ({page}) => {
  await page.getByRole('button', {name: 'Open dialog'}).click();
  await page.getByRole('dialog').getByRole('button', {name: 'Cancel subscription'}).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(notifications(page)).toContainText('Subscription cancelled');
});

test('an error notification stays until it is dismissed', async ({page}) => {
  await page.getByRole('button', {name: 'Show an error'}).click();
  const status = notifications(page);
  await expect(status).toContainText('The payment was declined');

  await status.getByRole('button', {name: 'Dismiss notification'}).click();
  await expect(status).toBeEmpty();
});

test('keyboard focus is drawn in the brand focus colour', async ({page, isMobile}) => {
  test.skip(isMobile, 'keyboard');
  const primary = page.getByRole('button', {name: 'Primary', exact: true});
  await primary.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');

  const focus = await brandToken(page, '--color-focus');
  const outline = await primary.evaluate((element) => getComputedStyle(element).outlineColor);
  // Computed colours come back as rgb(); compare channels with the token's hex.
  const hex = (value: number) => value.toString(16).padStart(2, '0');
  const [r = 0, g = 0, b = 0] = (outline.match(/\d+/g) ?? []).map(Number);
  expect(`#${hex(r)}${hex(g)}${hex(b)}`).toBe(focus);
});

test('an invalid field is described by its error', async ({page}) => {
  const email = page.getByRole('textbox', {name: 'Email address'});
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription('Enter a valid email address');
});
