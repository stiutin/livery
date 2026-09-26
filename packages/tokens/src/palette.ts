import {inSrgbGamut} from './color.ts';

/** The steps of a tonal scale and their OKLCH lightness: 50 is nearly white, 950 nearly black. */
export const STEPS = {
  50: 0.97,
  100: 0.94,
  200: 0.88,
  300: 0.8,
  400: 0.71,
  500: 0.62,
  600: 0.54,
  700: 0.46,
  800: 0.38,
  900: 0.3,
  950: 0.23,
} as const;

export type Step = keyof typeof STEPS;
export const STEP_NAMES = Object.keys(STEPS).map(Number) as Step[];

/** How much of the brand's chroma each step keeps: pale and dark ends are quieter than the middle. */
const CHROMA_SHAPE: Readonly<Record<Step, number>> = {
  50: 0.18,
  100: 0.3,
  200: 0.5,
  300: 0.72,
  400: 0.9,
  500: 1,
  600: 1,
  700: 0.95,
  800: 0.85,
  900: 0.72,
  950: 0.6,
};

const round = (value: number, digits = 4): number => Number(value.toFixed(digits));
// Chroma is rounded down, so rounding never pushes a fitted colour back out of the gamut.
const floorChroma = (value: number): number => Math.floor(value * 1e4) / 1e4;

/** Lowers chroma until the colour fits sRGB, keeping lightness and hue: the colour a screen can actually show. */
export function fitToGamut(lightness: number, chroma: number, hue: number): [number, number, number] {
  if (inSrgbGamut([lightness, chroma, hue])) {
    return [round(lightness), floorChroma(chroma), round(hue, 2)];
  }
  let low = 0;
  let high = chroma;
  for (let step = 0; step < 20; step++) {
    const middle = (low + high) / 2;
    if (inSrgbGamut([lightness, middle, hue])) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return [round(lightness), floorChroma(low), round(hue, 2)];
}

/**
 * A tonal scale in OKLCH from one colour: every step keeps the colour's hue, takes its lightness from STEPS
 * and a share of the colour's chroma, and is fitted into sRGB. OKLCH is perceptual, so the steps look evenly
 * spaced whatever the hue, which is what HSL cannot promise.
 */
export function tonalScale(chroma: number, hue: number): Record<Step, [number, number, number]> {
  const scale = {} as Record<Step, [number, number, number]>;
  for (const step of STEP_NAMES) {
    scale[step] = fitToGamut(STEPS[step], chroma * CHROMA_SHAPE[step], hue);
  }
  return scale;
}
