import {describe, expect, it} from 'vitest';

import {schemeAttribute} from './colorScheme';

// The head script that makes the same decision before hydration is covered end to end.
describe('colour scheme', () => {
  it('lets the visitor choice win over the brand default', () => {
    expect(schemeAttribute(null, 'dark')).toBe('dark');
    expect(schemeAttribute(null, 'system')).toBeUndefined();
    expect(schemeAttribute('light', 'dark')).toBe('light');
    expect(schemeAttribute('system', 'dark')).toBeUndefined();
  });
});
