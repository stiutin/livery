import {describe, expect, it} from 'vitest';

import {prerenderPaths, TENANT_PAGES} from './tenantPaths';

describe('prerenderPaths', () => {
  it('lists the landing page, each tenant root, and every page in every language', () => {
    const paths = prerenderPaths(['harbour', 'onyx'], ['en', 'de', 'es']);
    expect(paths).toHaveLength(1 + 2 * (1 + 3 * TENANT_PAGES.length));
    expect(paths).toContain('/harbour');
    expect(paths).toContain('/harbour/de');
    expect(paths).toContain('/onyx/es/theme/preview');
  });
});
