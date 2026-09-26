import {describe, expect, it} from 'vitest';

import {inSrgbGamut, parseHex, toOklch, toRgba} from './color.ts';
import {fitToGamut, STEP_NAMES, tonalScale} from './palette.ts';

describe('OKLCH', () => {
  it('converts sRGB to OKLCH and back', () => {
    for (const hex of ['#6d28d9', '#0f766e', '#d4a94a', '#ffffff', '#000000']) {
      const rgba = parseHex(hex);
      if (!rgba) {
        throw new Error(hex);
      }
      const back = toRgba({colorSpace: 'oklch', components: toOklch(rgba), alpha: 1});
      expect(back.r).toBeCloseTo(rgba.r, 3);
      expect(back.g).toBeCloseTo(rgba.g, 3);
      expect(back.b).toBeCloseTo(rgba.b, 3);
    }
  });

  it('knows pure red', () => {
    const [lightness, chroma, hue] = toOklch({r: 1, g: 0, b: 0, a: 1});
    expect(lightness).toBeCloseTo(0.628, 3);
    expect(chroma).toBeCloseTo(0.2577, 3);
    expect(hue).toBeCloseTo(29.23, 1);
  });

  it('fits a colour into sRGB by lowering chroma only', () => {
    expect(inSrgbGamut([0.7, 0.4, 150])).toBe(false);
    const [lightness, chroma, hue] = fitToGamut(0.7, 0.4, 150);
    expect(inSrgbGamut([lightness, chroma, hue])).toBe(true);
    expect([lightness, hue]).toEqual([0.7, 150]);
    expect(chroma).toBeLessThan(0.4);
  });
});

describe('tonalScale', () => {
  it('runs from light to dark in one hue, every step in gamut', () => {
    const scale = tonalScale(0.2, 290);
    const lightness = STEP_NAMES.map((step) => scale[step][0]);
    expect([...lightness].sort((a, b) => b - a)).toEqual(lightness);
    for (const step of STEP_NAMES) {
      expect(inSrgbGamut(scale[step]), String(step)).toBe(true);
      expect(scale[step][2]).toBe(290);
    }
  });
});
