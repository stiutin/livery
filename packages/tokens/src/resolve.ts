import {parseHex, toRgba} from './color.ts';
import type {
  ColorValue,
  DimensionValue,
  DurationValue,
  Problem,
  RawToken,
  ShadowLayer,
  TokenType,
  TokenValue,
} from './model.ts';

export interface ResolvedToken {
  readonly raw: RawToken;
  readonly value: TokenValue;
  /** The path this token points at when its whole value is an alias, such as `{semantic.color.brand}`. */
  readonly aliasOf: string | undefined;
}

type ValueOf<T extends TokenType> = Extract<TokenValue, {type: T}>['value'];

const FONT_WEIGHTS: Readonly<Record<string, number>> = {
  thin: 100,
  hairline: 100,
  'extra-light': 200,
  'ultra-light': 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  'semi-bold': 600,
  'demi-bold': 600,
  bold: 700,
  'extra-bold': 800,
  'ultra-bold': 800,
  black: 900,
  heavy: 900,
  'extra-black': 950,
  'ultra-black': 950,
};

/** The path inside `{…}` when the value is an alias, otherwise undefined. */
export function aliasTarget(value: unknown): string | undefined {
  return typeof value === 'string' ? /^\{([^{}]+)\}$/.exec(value)?.[1] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Thrown inside one token's resolution and turned into a Problem for that token. */
class InvalidValue extends Error {}

function fail(message: string): never {
  throw new InvalidValue(message);
}

function parseColor(value: unknown): ColorValue {
  if (!isRecord(value)) {
    return fail('a color is an object: {colorSpace, components, alpha?, hex?}');
  }
  const {colorSpace, components, alpha = 1, hex} = value;
  if (colorSpace !== 'srgb' && colorSpace !== 'oklch') {
    return fail(`colorSpace ${JSON.stringify(colorSpace)} is not supported; use "srgb" or "oklch"`);
  }
  if (!Array.isArray(components) || components.length !== 3 || !components.every(isNumber)) {
    return fail('components must be three numbers');
  }
  const [first, second, third] = components;
  if (first === undefined || second === undefined || third === undefined) {
    return fail('components must be three numbers');
  }
  if (colorSpace === 'srgb' && components.some((channel) => channel < 0 || channel > 1)) {
    return fail('sRGB components go from 0 to 1');
  }
  if (colorSpace === 'oklch' && (first < 0 || first > 1 || second < 0)) {
    return fail('OKLCH lightness goes from 0 to 1 and chroma cannot be negative');
  }
  if (!isNumber(alpha) || alpha < 0 || alpha > 1) {
    return fail('alpha goes from 0 to 1');
  }
  const color: ColorValue = {colorSpace, components: [first, second, third], alpha};

  if (hex !== undefined) {
    if (typeof hex !== 'string') {
      return fail('hex must be written as #rrggbb');
    }
    const fallback = parseHex(hex);
    if (!fallback) {
      return fail('hex must be written as #rrggbb');
    }
    const actual = toRgba(color);
    const drift = Math.max(
      Math.abs(actual.r - fallback.r),
      Math.abs(actual.g - fallback.g),
      Math.abs(actual.b - fallback.b)
    );
    // The hex is a fallback for tools; it must describe the same colour as the components.
    if (drift > 1.5 / 255) {
      return fail(`hex ${hex} does not match the components`);
    }
  }
  return color;
}

function parseDimension(value: unknown): DimensionValue {
  if (!isRecord(value) || !isNumber(value.value) || (value.unit !== 'px' && value.unit !== 'rem')) {
    return fail('a dimension is {value: number, unit: "px" | "rem"}');
  }
  return {value: value.value, unit: value.unit};
}

function parseDuration(value: unknown): DurationValue {
  if (!isRecord(value) || !isNumber(value.value) || (value.unit !== 'ms' && value.unit !== 's')) {
    return fail('a duration is {value: number, unit: "ms" | "s"}');
  }
  if (value.value < 0) {
    return fail('a duration cannot be negative');
  }
  return {value: value.value, unit: value.unit};
}

const isName = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

function parseFontFamily(value: unknown): readonly string[] {
  const names: unknown[] = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
  const valid = names.filter(isName);
  if (valid.length === 0 || valid.length !== names.length) {
    return fail('a font family is a name or a non-empty list of names');
  }
  return valid;
}

function parseFontWeight(value: unknown): number {
  if (isNumber(value) && value >= 1 && value <= 1000) {
    return value;
  }
  const keyword = typeof value === 'string' ? FONT_WEIGHTS[value] : undefined;
  return keyword ?? fail('a font weight is a number from 1 to 1000 or a keyword such as "bold"');
}

function parseCubicBezier(value: unknown): readonly [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(isNumber)) {
    return fail('a cubic Bézier is four numbers');
  }
  const [x1, y1, x2, y2] = value;
  if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
    return fail('a cubic Bézier is four numbers');
  }
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    return fail('the x values of a cubic Bézier go from 0 to 1');
  }
  return [x1, y1, x2, y2];
}

/**
 * Resolves every alias and validates every value. Each token is resolved once; a broken token is reported
 * where it is broken, and tokens that point at it are skipped rather than reported again.
 */
export function resolveTokens(tokens: ReadonlyMap<string, RawToken>): {
  resolved: ReadonlyMap<string, ResolvedToken>;
  problems: readonly Problem[];
} {
  const resolved = new Map<string, ResolvedToken>();
  const failed = new Set<string>();
  const problems: Problem[] = [];

  const resolve = (path: string, chain: readonly string[]): ResolvedToken | undefined => {
    const done = resolved.get(path);
    if (done || failed.has(path)) {
      return done;
    }
    const raw = tokens.get(path);
    if (!raw) {
      return undefined;
    }
    if (chain.includes(path)) {
      problems.push({source: raw.source, path, message: `circular alias: ${[...chain, path].join(' → ')}`});
      failed.add(path);
      return undefined;
    }

    try {
      const target = aliasTarget(raw.value);
      const token = target === undefined ? resolveValue(raw, [...chain, path]) : resolveAlias(raw, target, chain);
      resolved.set(path, token);
      return token;
    } catch (error) {
      failed.add(path);
      if (error instanceof InvalidValue) {
        problems.push({source: raw.source, path, message: error.message});
        return undefined;
      }
      throw error;
    }
  };

  /** Follows an alias; the error thrown when its target is broken carries no message and is not reported. */
  const follow = (target: string, chain: readonly string[]): ResolvedToken => {
    if (!tokens.has(target)) {
      return fail(`refers to {${target}}, which does not exist`);
    }
    const token = resolve(target, chain);
    if (!token) {
      throw new InvalidValue('');
    }
    return token;
  };

  const resolveAlias = (raw: RawToken, target: string, chain: readonly string[]): ResolvedToken => {
    const token = follow(target, [...chain, raw.path]);
    if (raw.type && raw.type !== token.value.type) {
      return fail(`is a ${raw.type} but refers to {${target}}, a ${token.value.type}`);
    }
    return {raw, value: token.value, aliasOf: target};
  };

  /** A value that may itself be an alias, inside a composite such as a shadow. */
  const nested = <T extends TokenType>(
    value: unknown,
    type: T,
    parse: (input: unknown) => ValueOf<T>,
    chain: readonly string[]
  ): ValueOf<T> => {
    const target = aliasTarget(value);
    if (target === undefined) {
      return parse(value);
    }
    const token = follow(target, chain);
    if (token.value.type !== type) {
      return fail(`{${target}} is a ${token.value.type}, not a ${type}`);
    }
    // The type check above narrows the union member at runtime; TypeScript cannot follow it through T.
    return token.value.value as ValueOf<T>;
  };

  const parseShadow = (value: unknown, chain: readonly string[]): readonly ShadowLayer[] =>
    (Array.isArray(value) ? value : [value]).map((layer): ShadowLayer => {
      if (!isRecord(layer)) {
        return fail('a shadow is {color, offsetX, offsetY, blur, spread, inset?} or a list of them');
      }
      const inset = layer.inset ?? false;
      if (typeof inset !== 'boolean') {
        return fail('a shadow inset is true or false');
      }
      return {
        color: nested(layer.color, 'color', parseColor, chain),
        offsetX: nested(layer.offsetX, 'dimension', parseDimension, chain),
        offsetY: nested(layer.offsetY, 'dimension', parseDimension, chain),
        blur: nested(layer.blur, 'dimension', parseDimension, chain),
        spread: nested(layer.spread, 'dimension', parseDimension, chain),
        inset,
      };
    });

  const resolveValue = (raw: RawToken, chain: readonly string[]): ResolvedToken => {
    const {type, value} = raw;
    if (!type) {
      return fail('has no $type: set it on the token or on a group above it');
    }
    const parsed = ((): TokenValue => {
      switch (type) {
        case 'color':
          return {type, value: parseColor(value)};
        case 'dimension':
          return {type, value: parseDimension(value)};
        case 'fontFamily':
          return {type, value: parseFontFamily(value)};
        case 'fontWeight':
          return {type, value: parseFontWeight(value)};
        case 'duration':
          return {type, value: parseDuration(value)};
        case 'number':
          return isNumber(value) ? {type, value} : fail('a number token holds a number');
        case 'cubicBezier':
          return {type, value: parseCubicBezier(value)};
        case 'shadow':
          return {type, value: parseShadow(value, chain)};
      }
    })();
    return {raw, value: parsed, aliasOf: undefined};
  };

  for (const path of tokens.keys()) {
    resolve(path, []);
  }
  // Tokens skipped because of a broken dependency leave an empty message behind; drop those.
  return {resolved, problems: problems.filter((problem) => problem.message !== '')};
}
