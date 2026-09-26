import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {CONTRACT} from './contract.ts';
import {compileTenantsFromDisk} from './node.ts';

const root = resolve(import.meta.dirname, '../../..');

describe('the tenants in this repository', () => {
  const result = compileTenantsFromDisk({root, tenantsDir: resolve(root, 'tenants'), defaultTenant: 'tenant-default'});

  it('compile without problems', () => {
    expect(result.report).toBe('');
    expect(result.tenants.map((tenant) => tenant.id)).toEqual(['tenant-alpha', 'tenant-beta', 'tenant-default']);
  });

  it('each define the whole contract', () => {
    for (const tenant of result.tenants) {
      expect(tenant.tokens.map((token) => token.path)).toEqual(CONTRACT.map((entry) => entry.path));
    }
  });

  it('name the default tenant in the manifest', () => {
    expect(result.manifest.defaultTenant).toBe('tenant-default');
  });
});

describe('compileTenantsFromDisk', () => {
  it('refuses a default tenant that does not exist', () => {
    expect(() => compileTenantsFromDisk({root, tenantsDir: resolve(root, 'tenants'), defaultTenant: 'nobody'})).toThrow(
      'the default tenant "nobody" has no tenants/nobody/tokens.json'
    );
  });
});
