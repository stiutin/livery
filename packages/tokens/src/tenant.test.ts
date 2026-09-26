import {describe, expect, it} from 'vitest';

import {parseTenantConfig} from './tenant.ts';

const parse = (json: unknown, id = 'acme') => {
  const result = parseTenantConfig(id, 'tenant.json', json, ['acme', 'house']);
  return {...result, messages: result.problems.map((problem) => `${problem.path}: ${problem.message}`)};
};

describe('parseTenantConfig', () => {
  it('reads a valid tenant, whose tokens default to its own folder', () => {
    expect(parse({name: 'Acme', locale: 'en-GB', currency: 'GBP', features: {payments: true}}).config).toEqual({
      id: 'acme',
      name: 'Acme',
      tokens: 'acme',
      locale: 'en-GB',
      currency: 'GBP',
      features: {payments: true},
    });
  });

  it("lets a tenant borrow another tenant's look", () => {
    expect(
      parse(
        {name: 'Acme Lite', tokens: 'house', locale: 'en-US', currency: 'USD', features: {payments: false}},
        'acme-lite'
      ).config?.tokens
    ).toBe('house');
  });

  it('reports every problem', () => {
    const {config, messages} = parse(
      {
        name: ' ',
        tokens: 'nobody',
        locale: 'en_GB',
        currency: 'pounds',
        colour: 'red',
        features: {payments: 'yes', chat: true},
      },
      'Acme_1'
    );
    expect(config).toBeUndefined();
    expect(messages).toEqual([
      '(folder): "Acme_1" cannot be a tenant id: use lower-case letters, digits and single hyphens',
      'colour: is not a tenant setting; use name, tokens, locale, currency and features',
      'features.chat: is not a feature; the flags are payments',
      'features.payments: must be true or false',
      'name: is required: the brand name people read',
      'tokens: must name a tenant folder with a tokens.json (acme, house)',
      'locale: must be a canonical BCP 47 locale, such as "en-GB"',
      'currency: must be an ISO 4217 code, such as "GBP"',
    ]);
  });

  it('wants canonical locales, as they are also used in URLs and HTML', () => {
    expect(parse({name: 'Acme', locale: 'en-gb', currency: 'GBP', features: {payments: true}}).messages).toEqual([
      'locale: must be a canonical BCP 47 locale, such as "en-GB"',
    ]);
  });
});
