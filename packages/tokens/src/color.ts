import type {ColorValue} from './model.ts';

/** A colour in gamma-encoded sRGB, every channel from 0 to 1. */
export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function linearToSrgb(channel: number): number {
  return channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** OKLCH to linear sRGB, following Björn Ottosson's OKLab definition. */
function oklchToLinearSrgb([lightness, chroma, hue]: readonly [number, number, number]): [number, number, number] {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/**
 * Converts any supported colour to sRGB. Colours outside the sRGB gamut are clipped per channel,
 * which is what a browser without wide-gamut output shows, and so what contrast has to be judged on.
 */
export function toRgba(color: ColorValue): Rgba {
  if (color.colorSpace === 'srgb') {
    const [r, g, b] = color.components;
    return {r: clamp01(r), g: clamp01(g), b: clamp01(b), a: clamp01(color.alpha)};
  }
  const [r, g, b] = oklchToLinearSrgb(color.components).map((channel) => clamp01(linearToSrgb(channel)));
  return {r: r ?? 0, g: g ?? 0, b: b ?? 0, a: clamp01(color.alpha)};
}

/** sRGB to OKLCH (lightness 0–1, chroma, hue in degrees), following Björn Ottosson's OKLab definition. */
export function toOklch({r, g, b}: Rgba): [number, number, number] {
  const [lr, lg, lb] = [r, g, b].map(srgbToLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bAxis);
  const hue = chroma < 1e-4 ? 0 : ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;
  return [lightness, chroma, hue];
}

/** Whether an OKLCH colour exists in sRGB without clipping. */
export function inSrgbGamut(components: readonly [number, number, number]): boolean {
  return oklchToLinearSrgb(components).every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);
}

/** Paints a translucent colour over an opaque one, the way browsers blend: in gamma-encoded sRGB. */
export function composite(foreground: Rgba, background: Rgba): Rgba {
  const mix = (top: number, bottom: number): number => top * foreground.a + bottom * (1 - foreground.a);
  return {
    r: mix(foreground.r, background.r),
    g: mix(foreground.g, background.g),
    b: mix(foreground.b, background.b),
    a: 1,
  };
}

/** WCAG 2.2 relative luminance. */
export function relativeLuminance({r, g, b}: Rgba): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/**
 * WCAG 2.2 contrast ratio, from 1 to 21. A translucent foreground is first composited over the background;
 * the background must be opaque, because what lies behind it is not known here.
 */
export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const top = foreground.a < 1 ? composite(foreground, background) : foreground;
  const [lighter, darker] = [relativeLuminance(top), relativeLuminance(background)].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

const toByte = (channel: number): number => Math.round(clamp01(channel) * 255);

export function toHex({r, g, b}: Rgba): string {
  return `#${[r, g, b].map((channel) => toByte(channel).toString(16).padStart(2, '0')).join('')}`;
}

/** Parses `#rgb` or `#rrggbb`. */
export function parseHex(hex: string): Rgba | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  const digits = match?.[1];
  if (!digits) {
    return null;
  }
  const full = digits.length === 3 ? digits.replace(/./g, '$&$&') : digits;
  const channel = (index: number): number => parseInt(full.slice(index, index + 2), 16) / 255;
  return {r: channel(0), g: channel(2), b: channel(4), a: 1};
}

const round = (value: number, digits: number): number => Number(value.toFixed(digits));

/** CSS for a colour: hex for opaque sRGB, `rgb()` with alpha otherwise, and `oklch()` kept as written. */
export function colorToCss(color: ColorValue): string {
  if (color.colorSpace === 'oklch') {
    const [lightness, chroma, hue] = color.components;
    const alpha = color.alpha < 1 ? ` / ${round(color.alpha * 100, 2)}%` : '';
    return `oklch(${round(lightness, 4)} ${round(chroma, 4)} ${round(hue, 2)}${alpha})`;
  }
  const rgba = toRgba(color);
  if (rgba.a >= 1) {
    return toHex(rgba);
  }
  return `rgb(${toByte(rgba.r)} ${toByte(rgba.g)} ${toByte(rgba.b)} / ${round(rgba.a * 100, 2)}%)`;
}
