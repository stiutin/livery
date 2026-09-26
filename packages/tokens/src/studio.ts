import {contrastRatio, parseHex, toHex, toOklch, toRgba} from './color.ts';
import {compileTenant} from './compile.ts';
import type {ColorValue, CompiledTenant, Problem, TokenSource} from './model.ts';
import {fitToGamut, type Step, STEP_NAMES, tonalScale} from './palette.ts';
import {parseTenantConfig, TENANT_ID} from './tenant.ts';

/**
 * Livery Studio: a brand from a handful of choices. Everything here is pure, so the Studio page, the unit tests
 * and the build run the same code: what Studio shows as passing is what the build accepts.
 */

export const FONTS = {
  system: {
    label: 'System sans',
    stack: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  },
  humanist: {label: 'Humanist', stack: ['Avenir Next', 'Avenir', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif']},
  rounded: {label: 'Rounded', stack: ['ui-rounded', 'SF Pro Rounded', 'Nunito', 'Segoe UI', 'Arial', 'sans-serif']},
  serif: {label: 'Serif', stack: ['ui-serif', 'Iowan Old Style', 'Georgia', 'Cambria', 'Times New Roman', 'serif']},
  mono: {label: 'Monospace', stack: ['ui-monospace', 'SF Mono', 'Cascadia Code', 'Menlo', 'Consolas', 'monospace']},
} as const;
export type FontKey = keyof typeof FONTS;

export const DENSITIES = {compact: 0.85, regular: 1, spacious: 1.15} as const;
export type Density = keyof typeof DENSITIES;

export interface StudioSettings {
  id: string;
  name: string;
  /** The brand colour as #rrggbb; everything else is derived from it. */
  color: string;
  mode: 'light' | 'dark';
  font: FontKey;
  /** The medium corner radius in px; small and large follow it. */
  radius: number;
  /** Pill-shaped buttons, whatever the radius. */
  pill: boolean;
  density: Density;
  locale: string;
  currency: string;
  payments: boolean;
}

export const DEFAULT_SETTINGS: StudioSettings = {
  id: 'aurora',
  name: 'Aurora',
  color: '#6d28d9',
  mode: 'light',
  font: 'system',
  radius: 10,
  pill: false,
  density: 'regular',
  locale: 'en-GB',
  currency: 'GBP',
  payments: true,
};

export const MAX_RADIUS = 24;

// ---- Sharing -------------------------------------------------------------------------------------------------

const toBase64Url = (text: string): string =>
  btoa(String.fromCodePoint(...new TextEncoder().encode(text)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

const fromBase64Url = (text: string): string =>
  new TextDecoder().decode(
    Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (character) => character.codePointAt(0) ?? 0)
  );

/** Settings as a short URL-safe string, for a share link. */
export function encodeSettings(settings: StudioSettings): string {
  return toBase64Url(JSON.stringify(settings));
}

/** Settings from a share link. Anything missing or invalid falls back to the default, so a link never breaks. */
export function decodeSettings(encoded: string): StudioSettings {
  let parsed: unknown;
  try {
    parsed = encoded ? JSON.parse(fromBase64Url(encoded)) : {};
  } catch {
    parsed = {};
  }
  const input = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  const pick = <K extends keyof StudioSettings>(key: K, valid: (value: unknown) => boolean): StudioSettings[K] =>
    valid(input[key]) ? (input[key] as StudioSettings[K]) : DEFAULT_SETTINGS[key];
  const isString = (value: unknown): value is string => typeof value === 'string';

  return {
    id: pick('id', (value) => isString(value) && value.length <= 40),
    name: pick('name', (value) => isString(value) && value.length <= 60),
    color: pick('color', (value) => isString(value) && /^#[0-9a-f]{6}$/i.test(value)),
    mode: pick('mode', (value) => value === 'light' || value === 'dark'),
    font: pick('font', (value) => isString(value) && Object.hasOwn(FONTS, value)),
    radius: pick(
      'radius',
      (value) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_RADIUS
    ),
    pill: pick('pill', (value) => typeof value === 'boolean'),
    density: pick('density', (value) => isString(value) && Object.hasOwn(DENSITIES, value)),
    locale: pick('locale', (value) => isString(value) && value.length <= 20),
    currency: pick('currency', (value) => isString(value) && /^[A-Z]{3}$/.test(value)),
    payments: pick('payments', (value) => typeof value === 'boolean'),
  };
}

// ---- Tokens --------------------------------------------------------------------------------------------------

type Lch = [number, number, number];

const oklch = ([lightness, chroma, hue]: Lch, alpha = 1): ColorValue & {hex: string} => {
  const color: ColorValue = {colorSpace: 'oklch', components: [lightness, chroma, hue], alpha};
  return {...color, hex: toHex(toRgba(color))};
};
const srgb = (hex: string, alpha?: number) => {
  const rgba = parseHex(hex) ?? {r: 0, g: 0, b: 0, a: 1};
  const round = (value: number) => Number(value.toFixed(4));
  return {
    colorSpace: 'srgb',
    components: [round(rgba.r), round(rgba.g), round(rgba.b)],
    ...(alpha === undefined ? {} : {alpha}),
    hex: hex.toLowerCase(),
  };
};
const contrast = (a: Lch, b: Lch): number =>
  contrastRatio(
    toRgba({colorSpace: 'oklch', components: a, alpha: 1}),
    toRgba({colorSpace: 'oklch', components: b, alpha: 1})
  );
const token = <T>(value: T, type?: string) => ({$value: value, ...(type ? {$type: type} : {})});
const ref = (path: string) => token(`{${path}}`);

/** The first step of the scale that reaches `minimum` against every background, or the last one tried. */
function firstPassing(scale: Record<Step, Lch>, order: Step[], backgrounds: Lch[], minimum: number): Step {
  const found = order.find((step) => backgrounds.every((background) => contrast(scale[step], background) >= minimum));
  return found ?? order[order.length - 1] ?? 600;
}

const FEEDBACK = {
  light: {
    danger: {text: '#b91c1c', surface: '#fef2f2', border: '#fecaca'},
    success: {text: '#15803d', surface: '#f0fdf4', border: '#bbf7d0'},
  },
  dark: {
    danger: {text: '#fca5a5', surface: '#2c1417', border: '#7f1d1d'},
    success: {text: '#86efac', surface: '#10261a', border: '#166534'},
  },
} as const;

/** The two files of a tenant, as Studio exports them. */
export interface StudioBrand {
  tenantJson: Record<string, unknown>;
  tokensJson: Record<string, unknown>;
}

export function brandFromSettings(settings: StudioSettings): StudioBrand {
  const dark = settings.mode === 'dark';
  const base = toOklch(parseHex(settings.color) ?? {r: 0.43, g: 0.16, b: 0.85, a: 1});
  const [lightness, chroma, hue] = base;
  const brand = tonalScale(Math.max(chroma, 0.02), hue);
  const neutral = tonalScale(0.02, hue);

  const surfaces: Record<'canvas' | 'default' | 'subtle', Lch> = dark
    ? {
        canvas: fitToGamut(0.17, 0.015, hue),
        default: fitToGamut(0.21, 0.015, hue),
        subtle: fitToGamut(0.26, 0.018, hue),
      }
    : {canvas: neutral[50], default: [0.995, 0, 0], subtle: neutral[100]};
  const text: Lch = dark ? fitToGamut(0.96, 0.01, hue) : neutral[950];
  const muted: Lch = dark ? fitToGamut(0.76, 0.02, hue) : neutral[700];
  const strongBorder: Lch = dark ? fitToGamut(0.6, 0.02, hue) : neutral[500];

  // Text on the brand: white or near-black, whichever reads better on the colour. The hover state then moves
  // away from that text (darker under white, lighter under ink), so it reads at least as well as the colour.
  const white: Lch = [1, 0, 0];
  const ink: Lch = fitToGamut(0.16, 0.02, hue);
  const onBrand = contrast(white, base) >= contrast(ink, base) ? white : ink;
  const hover = fitToGamut(Math.min(0.98, Math.max(0.05, lightness + (onBrand === white ? -0.08 : 0.08))), chroma, hue);

  const onSurfaces = [surfaces.default, surfaces.canvas];
  const link = firstPassing(brand, dark ? [300, 200, 400, 100, 50] : [700, 600, 800, 900, 950], onSurfaces, 4.5);
  const focus = firstPassing(brand, dark ? [400, 300, 500, 200] : [600, 700, 500, 800], onSurfaces, 3);
  const feedback = FEEDBACK[settings.mode];

  const scaleTokens = (scale: Record<Step, Lch>) =>
    Object.fromEntries(STEP_NAMES.map((step) => [String(step), token(oklch(scale[step]))]));
  const radius = settings.radius;

  const tokensJson: Record<string, unknown> = {
    $schema: 'https://www.designtokens.org/schemas/2025.10/format.json',
    $description: `${settings.name}: made in Livery Studio from ${settings.color.toLowerCase()}, ${settings.mode}.`,
    primitive: {
      color: {
        $type: 'color',
        brand: {...scaleTokens(brand), base: token(oklch(base)), hover: token(oklch(hover))},
        neutral: scaleTokens(neutral),
        surface: {
          canvas: token(oklch(surfaces.canvas)),
          default: token(oklch(surfaces.default)),
          subtle: token(oklch(surfaces.subtle)),
        },
        text: {default: token(oklch(text)), muted: token(oklch(muted))},
        border: {
          default: token(dark ? srgb('#ffffff', 0.1) : oklch(neutral[950], 0.12)),
          strong: token(oklch(strongBorder)),
        },
        'on-brand': token(oklch(onBrand)),
        danger: Object.fromEntries(Object.entries(feedback.danger).map(([key, hex]) => [key, token(srgb(hex))])),
        success: Object.fromEntries(Object.entries(feedback.success).map(([key, hex]) => [key, token(srgb(hex))])),
        ...(dark ? {overlay: token(srgb('#000000', 0.7)), shadow: token(srgb('#000000', 0.5))} : {}),
      },
    },
    semantic: {
      color: {
        $type: 'color',
        canvas: ref('primitive.color.surface.canvas'),
        surface: {default: ref('primitive.color.surface.default'), subtle: ref('primitive.color.surface.subtle')},
        border: {default: ref('primitive.color.border.default'), strong: ref('primitive.color.border.strong')},
        text: {default: ref('primitive.color.text.default'), muted: ref('primitive.color.text.muted')},
        brand: {
          default: ref('primitive.color.brand.base'),
          hover: ref('primitive.color.brand.hover'),
          on: ref('primitive.color.on-brand'),
        },
        link: ref(`primitive.color.brand.${link}`),
        focus: ref(`primitive.color.brand.${focus}`),
        danger: {
          text: ref('primitive.color.danger.text'),
          surface: ref('primitive.color.danger.surface'),
          border: ref('primitive.color.danger.border'),
        },
        success: {
          text: ref('primitive.color.success.text'),
          surface: ref('primitive.color.success.surface'),
          border: ref('primitive.color.success.border'),
        },
        ...(dark ? {overlay: ref('primitive.color.overlay')} : {}),
      },
      font: {family: {body: token([...FONTS[settings.font].stack], 'fontFamily')}},
      radius: {
        $type: 'dimension',
        small: token({value: Math.round(radius * 0.6), unit: 'px'}),
        medium: token({value: radius, unit: 'px'}),
        large: token({value: Math.min(32, Math.round(radius * 1.4)), unit: 'px'}),
      },
      density: token(DENSITIES[settings.density], 'number'),
      ...(dark
        ? {
            shadow: {
              $type: 'shadow',
              raised: token({
                color: '{primitive.color.shadow}',
                offsetX: px(0),
                offsetY: px(8),
                blur: px(24),
                spread: px(0),
              }),
              overlay: token({
                color: '{primitive.color.shadow}',
                offsetX: px(0),
                offsetY: px(32),
                blur: px(64),
                spread: px(-16),
              }),
            },
          }
        : {}),
    },
    ...(settings.pill ? {component: {button: {radius: token({value: 9999, unit: 'px'}, 'dimension')}}} : {}),
  };

  const tenantJson: Record<string, unknown> = {
    $schema: '../tenant.schema.json',
    name: settings.name,
    locale: settings.locale,
    currency: settings.currency,
    features: {payments: settings.payments},
  };

  return {tenantJson, tokensJson};
}

function px(value: number) {
  return {value, unit: 'px'};
}

// ---- Checking ------------------------------------------------------------------------------------------------

export interface StudioResult extends StudioBrand {
  /** The token set, compiled and checked by the same code as the build. */
  tokenSet: CompiledTenant;
  /** Every problem in the tokens, the settings or the id; the brand can be exported when there are none. */
  problems: readonly Problem[];
}

/**
 * Builds the brand and checks it as the build would: the tokens through compileTenant on top of the shared
 * base file, the settings through parseTenantConfig, and the id against the rules for tenant folders.
 */
export function checkBrand(
  settings: StudioSettings,
  base: TokenSource,
  existingIds: readonly string[] = []
): StudioResult {
  const brand = brandFromSettings(settings);
  const tokenSet = compileTenant(settings.id, [base, {name: 'tokens.json', json: brand.tokensJson}]);
  const config = parseTenantConfig(settings.id, 'tenant.json', brand.tenantJson, [settings.id]);
  const idProblems: Problem[] = [];
  if (TENANT_ID.test(settings.id) && existingIds.includes(settings.id)) {
    idProblems.push({
      source: 'tenant.json',
      path: '(folder)',
      message: `a tenant called "${settings.id}" already exists`,
    });
  }
  return {...brand, tokenSet, problems: [...config.problems, ...idProblems, ...tokenSet.problems]};
}
