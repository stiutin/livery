import {contrastRatio, toRgba} from './color.ts';
import type {ContractToken} from './contract.ts';
import {CONTRACT, CONTRAST_PAIRS, EMITTED_LAYERS, LAYERS} from './contract.ts';
import {cssVariable, valueToCss} from './css.ts';
import type {
  CompiledTenant,
  CompiledToken,
  ContrastResult,
  Problem,
  RawToken,
  TenantManifest,
  TokenSource,
} from './model.ts';
import {parseTokens} from './parse.ts';
import type {ResolvedToken} from './resolve.ts';
import {resolveTokens} from './resolve.ts';

const layerOf = (path: string): string => path.split('.')[0] ?? '';
const isEmitted = (path: string): boolean => EMITTED_LAYERS.some((layer) => layer === layerOf(path));

/** Merges files in order: a later file replaces a whole token of an earlier one, never part of it. */
function mergeSources(sources: readonly TokenSource[]): {tokens: Map<string, RawToken>; problems: Problem[]} {
  const tokens = new Map<string, RawToken>();
  const problems: Problem[] = [];

  for (const source of sources) {
    const parsed = parseTokens(source);
    problems.push(...parsed.problems);
    for (const raw of parsed.tokens) {
      if (!LAYERS.some((layer) => layer === layerOf(raw.path))) {
        problems.push({
          source: raw.source,
          path: raw.path,
          message: `tokens belong to one of the layers ${LAYERS.join(', ')}`,
        });
        continue;
      }
      tokens.set(raw.path, raw);
    }
  }
  return {tokens, problems};
}

function checkContract(
  tokens: ReadonlyMap<string, RawToken>,
  resolved: ReadonlyMap<string, ResolvedToken>,
  contract: readonly ContractToken[]
): Problem[] {
  const problems: Problem[] = [];
  const known = new Map(contract.map((entry) => [entry.path, entry]));

  for (const entry of contract) {
    const raw = tokens.get(entry.path);
    const token = resolved.get(entry.path);
    if (!raw) {
      problems.push({source: '(contract)', path: entry.path, message: `is missing (${entry.purpose})`});
    } else if (token && token.value.type !== entry.type) {
      problems.push({
        source: raw.source,
        path: entry.path,
        message: `must be a ${entry.type}, not a ${token.value.type}`,
      });
    }
  }
  for (const raw of tokens.values()) {
    if (isEmitted(raw.path) && !known.has(raw.path)) {
      problems.push({
        source: raw.source,
        path: raw.path,
        message: 'is not part of the contract; semantic and component tokens are a closed set',
      });
    }
  }
  return problems;
}

/** The token an alias chain ends at: the one that holds the value. */
function origin(token: ResolvedToken, resolved: ReadonlyMap<string, ResolvedToken>): ResolvedToken {
  let current = token;
  while (current.aliasOf !== undefined) {
    const next = resolved.get(current.aliasOf);
    if (!next) {
      break;
    }
    current = next;
  }
  return current;
}

function checkContrast(resolved: ReadonlyMap<string, ResolvedToken>): {results: ContrastResult[]; problems: Problem[]} {
  const results: ContrastResult[] = [];
  const problems: Problem[] = [];

  for (const {label, foreground, background, minimum} of CONTRAST_PAIRS) {
    const top = resolved.get(foreground);
    const bottom = resolved.get(background);
    // A missing or broken token has already been reported.
    if (top?.value.type !== 'color' || bottom?.value.type !== 'color') {
      continue;
    }
    const backgroundColor = toRgba(bottom.value.value);
    if (backgroundColor.a < 1) {
      problems.push({
        source: bottom.raw.source,
        path: background,
        message: `must be opaque: it is the background of "${label}", and contrast cannot be judged through it`,
      });
      continue;
    }
    const ratio = contrastRatio(toRgba(top.value.value), backgroundColor);
    const passes = ratio >= minimum;
    results.push({label, foreground, background, ratio, minimum, passes});
    if (!passes) {
      // Name where each colour is written, which is where a fix goes, rather than the alias the pair uses.
      const describe = (token: ResolvedToken): string => {
        const {raw} = origin(token, resolved);
        return `${valueToCss(token.value)} (${raw.path} in ${raw.source})`;
      };
      problems.push({
        source: 'contrast',
        path: label,
        message: `${describe(top)} on ${describe(bottom)} is ${ratio.toFixed(2)}:1, WCAG AA needs ${minimum}:1`,
      });
    }
  }
  return {results, problems};
}

/**
 * Compiles one tenant from its files, in order: usually the shared base, then the tenant's own file.
 * Nothing throws: every problem is collected, and any problem means the tenant must not ship.
 */
export function compileTenant(id: string, sources: readonly TokenSource[], contract = CONTRACT): CompiledTenant {
  const merged = mergeSources(sources);
  const {resolved, problems: resolveProblems} = resolveTokens(merged.tokens);
  const contrast = checkContrast(resolved);
  const order = new Map(contract.map((entry, index) => [entry.path, index]));

  const tokens: CompiledToken[] = [...resolved.values()]
    .filter((token) => isEmitted(token.raw.path))
    .sort((a, b) => (order.get(a.raw.path) ?? Infinity) - (order.get(b.raw.path) ?? Infinity))
    .map((token) => ({
      path: token.raw.path,
      cssVariable: cssVariable(token.raw.path),
      type: token.value.type,
      css:
        token.aliasOf !== undefined && isEmitted(token.aliasOf)
          ? `var(${cssVariable(token.aliasOf)})`
          : valueToCss(token.value),
      resolvedCss: valueToCss(token.value),
      description: token.raw.description,
    }));

  return {
    id,
    tokens,
    contrast: contrast.results,
    problems: [
      ...merged.problems,
      ...resolveProblems,
      ...checkContract(merged.tokens, resolved, contract),
      ...contrast.problems,
    ],
  };
}

const HEADER = '/* Generated by @livery/tokens from the tenants’ token files. Edit those, not this. */';

/**
 * One stylesheet for every tenant. The default tenant also owns `:root`, so the page is branded before
 * any tenant is chosen; the others apply to `<html data-tenant="…">` and come after it.
 */
export function tenantsToCss(tenants: readonly CompiledTenant[], defaultTenant: string): string {
  // `:root` and `[data-tenant]` weigh the same, so the default block must come first for the others to win.
  const ordered = [...tenants].sort((a, b) => Number(b.id === defaultTenant) - Number(a.id === defaultTenant));
  const blocks = ordered.map((tenant) => {
    const selectors = [`[data-tenant='${tenant.id}']`];
    if (tenant.id === defaultTenant) {
      selectors.unshift(':root');
    }
    const declarations = tenant.tokens.map((token) => `  ${token.cssVariable}: ${token.css};`).join('\n');
    return `${selectors.join(',\n')} {\n${declarations}\n}`;
  });
  return `${HEADER}\n\n${blocks.join('\n\n')}\n`;
}

export function tenantsToManifest(tenants: readonly CompiledTenant[], defaultTenant: string): TenantManifest {
  return {defaultTenant, tenants: tenants.map(({id, tokens}) => ({id, tokens}))};
}

/** Every problem of every tenant, one per line, ready for a terminal or Vite's error overlay. */
export function formatProblems(tenants: readonly CompiledTenant[]): string {
  return tenants
    .flatMap((tenant) =>
      tenant.problems.map((problem) => `  ${tenant.id} › ${problem.source} › ${problem.path}: ${problem.message}`)
    )
    .join('\n');
}
