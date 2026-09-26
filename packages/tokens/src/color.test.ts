import {describe, expect, it} from 'vitest';

import {colorToCss, composite, contrastRatio, parseHex, toHex, toRgba} from './color.ts';

const hex = (value: string) => {
  const color = parseHex(value);
  if (!color) {
    throw new Error(`bad hex ${value}`);
  }
  return color;
};

describe('contrast', () => {
  it('matches the WCAG extremes and a known mid-grey', () => {
    expect(contrastRatio(hex('#000000'), hex('#ffffff'))).toBeCloseTo(21, 5);
    expect(contrastRatio(hex('#ffffff'), hex('#ffffff'))).toBeCloseTo(1, 5);
    // #767676 is the lightest grey that passes 4.5:1 on white.
    expect(contrastRatio(hex('#767676'), hex('#ffffff'))).toBeCloseTo(4.54, 2);
  });

  it('does not depend on which colour is the foreground', () => {
    expect(contrastRatio(hex('#5b21b6'), hex('#f1eef8'))).toBeCloseTo(
      contrastRatio(hex('#f1eef8'), hex('#5b21b6')),
      10
    );
  });

  it('composites a translucent foreground over the background first', () => {
    const halfBlack = {...hex('#000000'), a: 0.5};
    expect(toHex(composite(halfBlack, hex('#ffffff')))).toBe('#808080');
    expect(contrastRatio(halfBlack, hex('#ffffff'))).toBeCloseTo(contrastRatio(hex('#808080'), hex('#ffffff')), 1);
  });

  it('catches the original alpha theme: white on its cyan hover colour', () => {
    expect(contrastRatio(hex('#ffffff'), hex('#06b6d4'))).toBeLessThan(2.5);
  });
});

describe('colour conversion and CSS', () => {
  it('converts OKLCH to sRGB', () => {
    const red = toRgba({colorSpace: 'oklch', components: [0.6279554, 0.2576833, 29.2338851], alpha: 1});
    expect(toHex(red)).toBe('#ff0000');
  });

  it('clips OKLCH colours outside the sRGB gamut instead of wrapping', () => {
    const vivid = toRgba({colorSpace: 'oklch', components: [0.7, 0.4, 150], alpha: 1});
    for (const channel of [vivid.r, vivid.g, vivid.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    }
  });

  it('writes hex for opaque sRGB, rgb() with alpha, and keeps OKLCH', () => {
    expect(colorToCss({colorSpace: 'srgb', components: [0.3569, 0.1294, 0.7137], alpha: 1})).toBe('#5b21b6');
    expect(colorToCss({colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.12})).toBe('rgb(0 0 0 / 12%)');
    expect(colorToCss({colorSpace: 'oklch', components: [0.5, 0.2, 290], alpha: 0.5})).toBe('oklch(0.5 0.2 290 / 50%)');
  });

  it('reads short and long hex, and rejects anything else', () => {
    expect(parseHex('#fff')).toEqual(hex('#ffffff'));
    expect(parseHex('fff')).toBeNull();
    expect(parseHex('#ggg')).toBeNull();
  });
});
