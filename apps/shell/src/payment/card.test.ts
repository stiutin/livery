import {describe, expect, it} from 'vitest';

import {isCardNumber, isCvc, isExpiry} from './card';

describe('card checks', () => {
  it('accepts numbers that pass the Luhn checksum, with spaces or hyphens', () => {
    expect(isCardNumber('4242 4242 4242 4242')).toBe(true);
    expect(isCardNumber('4000-0027-6000-3184')).toBe(true);
    expect(isCardNumber('4242 4242 4242 4241')).toBe(false);
    expect(isCardNumber('4242')).toBe(false);
  });

  it('accepts an expiry from this month on', () => {
    const today = new Date(2026, 8, 26);
    expect(isExpiry('09/26', today)).toBe(true);
    expect(isExpiry('01/27', today)).toBe(true);
    expect(isExpiry('08/26', today)).toBe(false);
    expect(isExpiry('13/30', today)).toBe(false);
    expect(isExpiry('0926', today)).toBe(false);
  });

  it('accepts three or four digits as a security code', () => {
    expect(isCvc('123')).toBe(true);
    expect(isCvc('1234')).toBe(true);
    expect(isCvc('12a')).toBe(false);
  });
});
