import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {CONTRACT} from './contract.ts';
import {compileTenantsFromDisk} from './node.ts';

const root = resolve(import.meta.dirname, '../../..');

describe('the tenants in this repository', () => {
  const result = compileTenantsFromDisk({root, tenantsDir: resolve(root, 'tenants'), defaultTenant: 'harbour'});

  it('compile without problems', () => {
    expect(result.report).toBe('');
    expect(result.tokenSets.map((set) => set.id)).toEqual(['harbour', 'meadow', 'onyx']);
  });

  it('each define the whole contract', () => {
    for (const tenant of result.tokenSets) {
      expect(tenant.tokens.map((token) => token.path)).toEqual(CONTRACT.map((entry) => entry.path));
    }
  });

  it('are listed with their settings and the CSS of their token set', () => {
    expect(result.tenants.map(({id, tokenSet, features}) => [id, tokenSet, features.payments])).toEqual([
      ['harbour', 'harbour', true],
      ['meadow', 'meadow', false],
      ['onyx', 'onyx', true],
    ]);
    const onyx = result.tenants.find((tenant) => tenant.id === 'onyx');
    expect(onyx).toMatchObject({name: 'Onyx', locale: 'en-US', currency: 'USD'});
    expect(onyx?.css).toContain('--color-canvas:#0c0c10;');
  });
});

describe('compileTenantsFromDisk', () => {
  it('refuses a default tenant that does not exist', () => {
    expect(() => compileTenantsFromDisk({root, tenantsDir: resolve(root, 'tenants'), defaultTenant: 'nobody'})).toThrow(
      'the default tenant "nobody" has no tenants/nobody/tenant.json'
    );
  });
});
