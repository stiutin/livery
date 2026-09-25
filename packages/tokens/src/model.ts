/**
 * The subset of the Design Tokens Format Module 2025.10 (https://www.designtokens.org/TR/2025.10/format/)
 * that Livery uses. Values are validated when they are resolved, so these types describe valid input.
 */

export const TOKEN_TYPES = [
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'number',
  'cubicBezier',
  'shadow',
] as const;

export type TokenType = (typeof TOKEN_TYPES)[number];

export type ColorSpace = 'srgb' | 'oklch';

/** A colour as the format writes it: components in the colour space's own ranges, alpha from 0 to 1. */
export interface ColorValue {
  readonly colorSpace: ColorSpace;
  readonly components: readonly [number, number, number];
  readonly alpha: number;
}

export interface DimensionValue {
  readonly value: number;
  readonly unit: 'px' | 'rem';
}

export interface DurationValue {
  readonly value: number;
  readonly unit: 'ms' | 's';
}

export interface ShadowLayer {
  readonly color: ColorValue;
  readonly offsetX: DimensionValue;
  readonly offsetY: DimensionValue;
  readonly blur: DimensionValue;
  readonly spread: DimensionValue;
  readonly inset: boolean;
}

/** A resolved value, tagged with its type so every consumer can switch on it exhaustively. */
export type TokenValue =
  | {readonly type: 'color'; readonly value: ColorValue}
  | {readonly type: 'dimension'; readonly value: DimensionValue}
  | {readonly type: 'fontFamily'; readonly value: readonly string[]}
  | {readonly type: 'fontWeight'; readonly value: number}
  | {readonly type: 'duration'; readonly value: DurationValue}
  | {readonly type: 'number'; readonly value: number}
  | {readonly type: 'cubicBezier'; readonly value: readonly [number, number, number, number]}
  | {readonly type: 'shadow'; readonly value: readonly ShadowLayer[]};

/** One token as found in a file, before aliases are resolved. */
export interface RawToken {
  /** Dot-separated path, such as `semantic.color.text.default`. */
  readonly path: string;
  /** The file it came from, for messages. */
  readonly source: string;
  /** Its own `$type`, or the nearest group's. Absent only for an alias, which takes its target's type. */
  readonly type: TokenType | undefined;
  readonly value: unknown;
  readonly description: string | undefined;
}

/** A problem in a tenant's tokens. Any problem fails the build. */
export interface Problem {
  readonly source: string;
  readonly path: string;
  readonly message: string;
}

/** One of the contract's foreground/background pairs, measured. */
export interface ContrastResult {
  readonly label: string;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly minimum: number;
  readonly passes: boolean;
}

/** A token as the app receives it: its CSS custom property and the CSS it holds. */
export interface CompiledToken {
  readonly path: string;
  readonly cssVariable: string;
  readonly type: TokenType;
  /** A `var()` when the token is an alias of another emitted token, the value itself otherwise. */
  readonly css: string;
  /** The value with every alias followed, for previews. */
  readonly resolvedCss: string;
  readonly description: string | undefined;
}

export interface CompiledTenant {
  readonly id: string;
  readonly tokens: readonly CompiledToken[];
  readonly contrast: readonly ContrastResult[];
  readonly problems: readonly Problem[];
}

/** What the app imports from `virtual:livery/tenants`. */
export interface TenantManifest {
  readonly defaultTenant: string;
  readonly tenants: readonly {readonly id: string; readonly tokens: readonly CompiledToken[]}[];
}

/** A token file with the name it is reported under. */
export interface TokenSource {
  readonly name: string;
  readonly json: unknown;
}
