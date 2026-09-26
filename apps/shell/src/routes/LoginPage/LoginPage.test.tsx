import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, test} from 'vitest';

import {WRONG_PASSWORD} from '../../mocks/constants';
import {renderPage} from '../../test/render';
import LoginPage from './LoginPage';

const renderLogin = (path = '/harbour/en/login') =>
  renderPage(<LoginPage />, {
    path,
    routes: {'/harbour/en/account': <p>Account page</p>, '/harbour/en/invoices': <p>Invoices page</p>},
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
    renderLogin('/harbour/en/login?next=invoices');
    await signIn('ada@example.com', 'secret-password');
    expect(await screen.findByText('Invoices page')).toBeInTheDocument();
  });

  test('explains why a sign-in is needed', () => {
    renderLogin('/harbour/en/login?next=invoices');
    expect(screen.getByText('Sign in to open your invoices.')).toHaveAttribute('role', 'status');
  });

  test("ignores a next that is not one of the tenant's pages", async () => {
    renderLogin('/harbour/en/login?next=%2F%2Fevil.example%2F');
    await signIn('ada@example.com', 'secret-password');
    expect(await screen.findByText('Account page')).toBeInTheDocument();
  });

  test('shows the API error when the password is refused', async () => {
    renderLogin();
    await signIn('ada@example.com', WRONG_PASSWORD);
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password is not right.');
  });
});
