import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {CONTRACT} from './contract.ts';
import {compileTenantsFromDisk} from './node.ts';

const root = resolve(import.meta.dirname, '../../..');

describe('the tenants in this repository', () => {
  const result = compileTenantsFromDisk({root, tenantsDir: resolve(root, 'tenants'), defaultTenant: 'tenant-default'});

  it('compile without problems', () => {
    expect(result.report).toBe('');
    expect(result.tokenSets.map((set) => set.id)).toEqual(['tenant-alpha', 'tenant-beta', 'tenant-default']);
  });

  it('each define the whole contract', () => {
    for (const tenant of result.tokenSets) {
      expect(tenant.tokens.map((token) => token.path)).toEqual(CONTRACT.map((entry) => entry.path));
    }
  });

  it('are listed with their settings and the CSS of their token set', () => {
    expect(result.tenants.map(({id, tokenSet}) => [id, tokenSet])).toEqual([
      ['tenant-alpha', 'tenant-alpha'],
      ['tenant-beta', 'tenant-beta'],
      ['tenant-default', 'tenant-default'],
      ['tenant-empty', 'tenant-default'],
    ]);
    const alpha = result.tenants.find((tenant) => tenant.id === 'tenant-alpha');
    expect(alpha).toMatchObject({name: 'Alpha', locale: 'en-GB', currency: 'GBP'});
    expect(alpha?.css).toContain('--color-brand-default:#5b21b6;');
  });
});

describe('compileTenantsFromDisk', () => {
  it('refuses a default tenant that does not exist', () => {
    expect(() => compileTenantsFromDisk({root, tenantsDir: resolve(root, 'tenants'), defaultTenant: 'nobody'})).toThrow(
      'the default tenant "nobody" has no tenants/nobody/tenant.json'
    );
  });
});
