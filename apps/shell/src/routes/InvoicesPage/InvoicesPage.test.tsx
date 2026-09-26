import {screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, test} from 'vitest';

import {TEST_CARDS} from '../../mocks/constants';
import {renderPage, sessionFor} from '../../test/render';
import InvoicesPage from './InvoicesPage';

const renderInvoices = (email = 'ada@example.com', payments = true) =>
  renderPage(<InvoicesPage />, {
    path: '/harbour/en/invoices',
    tenant: {features: {payments}},
    session: sessionFor(email),
    routes: {'/harbour/en/login': <p>Login page</p>},
  });

async function openFirstPayment() {
  const [first] = await screen.findAllByRole('button', {name: /^Pay HAR-/});
  if (!first) {
    throw new Error('no invoice to pay');
  }
  await userEvent.click(first);
}

async function payWith(number: string) {
  const dialog = await screen.findByRole('dialog');
  await userEvent.type(within(dialog).getByLabelText('Card number'), number);
  await userEvent.type(within(dialog).getByLabelText('Expiry (MM/YY)'), '12/40');
  await userEvent.type(within(dialog).getByLabelText('Security code'), '123');
  await userEvent.click(within(dialog).getByRole('button', {name: /^Pay /}));
  return dialog;
}

describe('InvoicesPage', () => {
  test('sends signed-out visitors to the login page', async () => {
    renderPage(<InvoicesPage />, {path: '/harbour/en/invoices', routes: {'/harbour/en/login': <p>Login page</p>}});
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  test('lists the invoices with amounts in the tenant currency', async () => {
    renderInvoices();
    const table = await screen.findByRole('table', {name: 'Your invoices, newest first'});
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getAllByText(/£/).length).toBeGreaterThan(0);
    expect(within(table).getByText('Overdue')).toBeInTheDocument();
  });

  test('shows the empty state for a new customer', async () => {
    renderInvoices('new@example.com');
    expect(await screen.findByRole('cell', {name: 'No invoices yet.'})).toBeInTheDocument();
  });

  test('pays an invoice by card and marks it paid', async () => {
    renderInvoices();
    await openFirstPayment();
    const dialog = await payWith(TEST_CARDS.success);

    expect(await within(dialog).findByText(/is paid/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', {name: 'Done'}));
    expect(await screen.findByText(/is paid\. Thank you\./)).toBeInTheDocument();
  });

  test('keeps the form open with the reason when the card is declined', async () => {
    renderInvoices();
    await openFirstPayment();
    const dialog = await payWith(TEST_CARDS.declined);

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Your card was declined.');
    expect(within(dialog).getByLabelText('Card number')).toBeInTheDocument();
  });

  test('asks for the bank confirmation, and pays once it is given', async () => {
    renderInvoices();
    await openFirstPayment();
    const dialog = await payWith(TEST_CARDS.confirm);

    await userEvent.click(await within(dialog).findByRole('button', {name: 'Confirm payment'}));
    expect(await within(dialog).findByText(/is paid/)).toBeInTheDocument();
  });

  test('checks the card before sending it', async () => {
    renderInvoices();
    await openFirstPayment();
    const dialog = await payWith('1234 5678');
    expect(await within(dialog).findByText('Enter a valid card number')).toBeInTheDocument();
  });

  test('offers bank transfer instead of card payments when the tenant has them off', async () => {
    renderInvoices('ada@example.com', false);
    expect(await screen.findByRole('heading', {name: 'Pay by bank transfer'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /^Pay /})).not.toBeInTheDocument();
  });
});

describe('InvoicesPage in other languages', () => {
  test('writes the summary with German plurals and money', async () => {
    renderPage(<InvoicesPage />, {
      path: '/meadow/de/invoices',
      tenant: {brandId: 'meadow', name: 'Meadow', locale: 'de-DE', currency: 'EUR', features: {payments: false}},
      session: sessionFor('ada@example.com', 'meadow'),
      language: 'de',
    });
    expect(await screen.findByText('4 Rechnungen, 2 offen.')).toBeInTheDocument();
    expect(screen.getByRole('table', {name: 'Deine Rechnungen, neueste zuerst'})).toHaveTextContent(/\d+,\d{2}\s€/);
    expect(screen.getByRole('heading', {name: 'Per Überweisung bezahlen'})).toBeInTheDocument();
  });

  test('shows API errors in the page language', async () => {
    renderPage(<InvoicesPage />, {
      path: '/harbour/es/invoices',
      session: {token: 'not-a-token', name: 'Ada', email: 'ada@example.com'},
      language: 'es',
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Vuelve a iniciar sesión.');
  });
});
