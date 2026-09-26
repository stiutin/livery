import {render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {describe, expect, test} from 'vitest';

import {TenantProvider} from '../../tenant/TenantContext';
import HomePage from './HomePage';

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/tenant-alpha']}>
      <TenantProvider value={{brandId: 'tenant-alpha', name: 'Alpha', locale: 'en-GB', currency: 'GBP'}}>
        <HomePage />
      </TenantProvider>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  test("shows the tenant's settings", () => {
    renderHomePage();
    expect(screen.getByRole('heading', {level: 1, name: 'Welcome to Alpha'})).toBeInTheDocument();
    expect(screen.getByText('/tenant-alpha')).toBeInTheDocument();
    expect(screen.getByText('en-GB')).toBeInTheDocument();
    expect(screen.getByText('GBP')).toBeInTheDocument();
  });

  test("links to the tenant's pages under its own path", () => {
    renderHomePage();
    const pages = within(screen.getByRole('heading', {name: 'Pages'}).closest('div') ?? document.body);
    expect(pages.getByRole('link', {name: 'Login'})).toHaveAttribute('href', '/tenant-alpha/auth/login');
    expect(pages.getByRole('link', {name: 'Billing'})).toHaveAttribute('href', '/tenant-alpha/account/billing');
    expect(pages.getByRole('link', {name: 'Theme preview'})).toHaveAttribute('href', '/tenant-alpha/theme/preview');
  });

  test('links to every other tenant, not to itself', () => {
    renderHomePage();
    const others = within(screen.getByRole('heading', {name: 'Other tenants'}).closest('div') ?? document.body);
    const names = others.getAllByRole('link').map((link) => link.textContent);
    expect(names).toContain('Beta');
    expect(names).toContain('Livery');
    expect(names).not.toContain('Alpha');
  });
});
