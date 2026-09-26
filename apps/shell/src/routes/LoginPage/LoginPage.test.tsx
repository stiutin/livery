import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, test} from 'vitest';

import {WRONG_PASSWORD} from '../../mocks/handlers';
import {renderPage} from '../../test/render';
import LoginPage from './LoginPage';

const renderLogin = (path = '/harbour/login') =>
  renderPage(<LoginPage />, {
    path,
    routes: {'/harbour/account': <p>Account page</p>, '/harbour/invoices': <p>Invoices page</p>},
  });

async function signIn(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email address'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', {name: 'Sign in'}));
}

describe('LoginPage', () => {
  test('validates the fields before calling the API', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', {name: 'Sign in'}));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  test('signs in and opens the account', async () => {
    renderLogin();
    await signIn('ada@example.com', 'secret-password');
    expect(await screen.findByText('Account page')).toBeInTheDocument();
    expect(sessionStorage.getItem('livery:session:harbour')).toContain('ada@example.com');
  });

  test('returns to the page that asked for a sign-in', async () => {
    renderLogin('/harbour/login?next=%2Fharbour%2Finvoices');
    await signIn('ada@example.com', 'secret-password');
    expect(await screen.findByText('Invoices page')).toBeInTheDocument();
  });

  test("never returns to another tenant's page", async () => {
    renderLogin('/harbour/login?next=%2Fonyx%2Finvoices');
    await signIn('ada@example.com', 'secret-password');
    expect(await screen.findByText('Account page')).toBeInTheDocument();
  });

  test('shows the API error when the password is refused', async () => {
    renderLogin();
    await signIn('ada@example.com', WRONG_PASSWORD);
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password is not right.');
  });
});
