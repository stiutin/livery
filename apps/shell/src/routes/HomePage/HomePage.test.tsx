import {screen, within} from '@testing-library/react';
import {describe, expect, test} from 'vitest';

import {renderPage, sessionFor} from '../../test/render';
import HomePage from './HomePage';

const tenant = {brandId: 'onyx', name: 'Onyx', locale: 'en-US', currency: 'USD', features: {payments: true}};

describe('HomePage', () => {
  test("shows the tenant's settings and invites a sign-in", async () => {
    renderPage(<HomePage />, {path: '/onyx/en', tenant});
    expect(screen.getByRole('heading', {level: 1, name: 'Welcome to Onyx'})).toBeInTheDocument();
    expect(screen.getByText('/onyx')).toBeInTheDocument();
    expect(await screen.findByRole('link', {name: 'Sign in'})).toHaveAttribute('href', '/onyx/en/login');
  });

  test('greets a signed-in customer', async () => {
    renderPage(<HomePage />, {path: '/onyx/en', tenant, session: sessionFor('ada@example.com', 'onyx')});
    expect(await screen.findByRole('link', {name: 'Open your account'})).toHaveAttribute('href', '/onyx/en/account');
  });

  test('links to every other tenant, not to itself', () => {
    renderPage(<HomePage />, {path: '/onyx/en', tenant});
    const others = within(screen.getByRole('heading', {name: 'Other tenants'}).closest('div') ?? document.body);
    expect(others.getAllByRole('link').map((link) => link.textContent)).toEqual(['Harbour', 'Meadow']);
  });
});
