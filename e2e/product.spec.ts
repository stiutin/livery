import {expect, type Page, test} from '@playwright/test';

import {trackErrors} from './helpers';

const TENANTS = [
  {id: 'harbour', name: 'Harbour', payments: true, money: /£/},
  {id: 'onyx', name: 'Onyx', payments: true, money: /\$/},
  {id: 'meadow', name: 'Meadow', payments: false, money: /€/},
] as const;

async function signIn(page: Page, tenant: string, email = 'ada@example.com') {
  await page.goto(`./${tenant}/en/login`);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('secret-password');
  await page.getByRole('button', {name: 'Sign in'}).click();
  await expect(page).toHaveURL(new RegExp(`/${tenant}/en/account$`));
}

async function payFirstInvoice(page: Page, card: string) {
  await page
    .getByRole('button', {name: /^Pay [A-Z]{3}-/})
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Card number').fill(card);
  await dialog.getByLabel('Expiry (MM/YY)').fill('12/40');
  await dialog.getByLabel('Security code').fill('123');
  await dialog.getByRole('button', {name: /^Pay /}).click();
  return dialog;
}

for (const tenant of TENANTS) {
  test.describe(tenant.name, () => {
    test('a customer signs in and sees the account and the invoices', async ({page}) => {
      const errors = trackErrors(page);
      await signIn(page, tenant.id);

      await expect(page.getByRole('heading', {level: 2, name: 'Ada'})).toBeVisible();
      await expect(page.getByText(/due on 2 invoices/)).toContainText(tenant.money);

      await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Invoices'}).click();
      const table = page.getByRole('table', {name: 'Your invoices, newest first'});
      await expect(table.getByRole('row')).toHaveCount(5);
      await expect(table.getByText('Overdue')).toBeVisible();
      expect(errors).toEqual([]);
    });

    if (tenant.payments) {
      test('an invoice is paid by card', async ({page}) => {
        await signIn(page, tenant.id);
        await page.goto(`./${tenant.id}/en/invoices`);

        const dialog = await payFirstInvoice(page, '4242 4242 4242 4242');
        await expect(dialog.getByText(/is paid/)).toBeVisible();
        await dialog.getByRole('button', {name: 'Done'}).click();

        await expect(page.getByRole('region', {name: 'Notifications'})).toContainText('is paid. Thank you.');
        await expect(page.getByRole('button', {name: /^Pay [A-Z]{3}-/})).toHaveCount(1);
      });
    } else {
      test('invoices show bank-transfer details instead of card payments', async ({page}) => {
        await signIn(page, tenant.id);
        await page.goto(`./${tenant.id}/en/invoices`);

        await expect(page.getByRole('heading', {name: 'Pay by bank transfer'})).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByRole('button', {name: /^Pay /})).toHaveCount(0);
      });
    }
  });
}

test('a declined card keeps the form open, and another card goes through', async ({page}) => {
  await signIn(page, 'harbour');
  await page.goto('./harbour/en/invoices');

  const dialog = await payFirstInvoice(page, '4000 0000 0000 0002');
  await expect(dialog.getByRole('alert')).toContainText('Your card was declined.');

  await dialog.getByLabel('Card number').fill('4242 4242 4242 4242');
  await dialog.getByRole('button', {name: /^Pay /}).click();
  await expect(dialog.getByText(/is paid/)).toBeVisible();
});

test('the bank can ask for a confirmation before the payment goes through', async ({page}) => {
  await signIn(page, 'onyx');
  await page.goto('./onyx/en/invoices');

  const dialog = await payFirstInvoice(page, '4000 0027 6000 3184');
  await expect(dialog.getByText('Your bank asks you to confirm')).toBeVisible();
  await dialog.getByRole('button', {name: 'Confirm payment'}).click();
  await expect(dialog.getByText(/is paid/)).toBeVisible();
});

test('a paid invoice stays paid after a reload', async ({page}) => {
  await signIn(page, 'onyx');
  await page.goto('./onyx/en/invoices');
  const dialog = await payFirstInvoice(page, '4242 4242 4242 4242');
  await dialog.getByRole('button', {name: 'Done'}).click();

  await page.reload();
  await expect(page.getByRole('button', {name: /^Pay [A-Z]{3}-/})).toHaveCount(1);
});

test('a new customer has no invoices', async ({page}) => {
  await signIn(page, 'meadow', 'new.customer@example.com');

  await expect(page.getByText('Nothing to pay. You are all settled.')).toBeVisible();
  await page.goto('./meadow/en/invoices');
  await expect(page.getByRole('cell', {name: 'No invoices yet.'})).toBeVisible();
});

test('signed-out visitors are sent to the login page and back', async ({page}) => {
  await page.goto('./onyx/en/account');
  await expect(page).toHaveURL(/\/onyx\/en\/login\?next=account$/);
  await expect(page.getByRole('status').filter({hasText: 'Sign in to open'})).toHaveText(
    'Sign in to open your account.'
  );

  await page.getByLabel('Email address').fill('ada@example.com');
  await page.getByLabel('Password').fill('secret-password');
  await page.getByRole('button', {name: 'Sign in'}).click();
  await expect(page).toHaveURL(/\/onyx\/en\/account$/);
});

test('signing out ends the session', async ({page}) => {
  await signIn(page, 'harbour');
  await page.getByRole('button', {name: 'Sign out'}).click();

  await expect(page.getByRole('link', {name: 'Sign in'}).first()).toBeVisible();
  await page.goto('./harbour/en/invoices');
  await expect(page).toHaveURL(/\/harbour\/en\/login/);
});

test('a refused password is explained', async ({page}) => {
  await page.goto('./harbour/en/login');
  await page.getByLabel('Email address').fill('ada@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', {name: 'Sign in'}).click();
  await expect(page.getByRole('alert')).toHaveText('The email or password is not right.');
});

test('the menu sends a signed-out visitor to sign in, in any language, and on to the page', async ({page}) => {
  await page.goto('./meadow/en');
  await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Invoices'}).click();
  await expect(page).toHaveURL(/\/meadow\/en\/login\?next=invoices$/);

  // Switching language keeps the page to return to.
  await page.getByRole('navigation', {name: 'Language'}).getByRole('link', {name: 'Deutsch'}).click();
  await expect(page).toHaveURL(/\/meadow\/de\/login\?next=invoices$/);
  await expect(page.getByRole('status').filter({hasText: 'Melde dich an'})).toHaveText(
    'Melde dich an, um deine Rechnungen zu öffnen.'
  );

  await page.getByLabel('E-Mail-Adresse').fill('ada@example.com');
  await page.getByLabel('Passwort').fill('secret-password');
  await page.getByRole('button', {name: 'Anmelden'}).click();
  await expect(page).toHaveURL(/\/meadow\/de\/invoices$/);
  await expect(page.getByRole('heading', {level: 1, name: 'Rechnungen'})).toBeVisible();

  // Signed in, the menu opens the pages themselves.
  await page.getByRole('navigation', {name: 'Hauptnavigation'}).getByRole('link', {name: 'Konto'}).click();
  await expect(page).toHaveURL(/\/meadow\/de\/account$/);
  await expect(page.getByRole('heading', {level: 1, name: 'Dein Konto'})).toBeVisible();
});
