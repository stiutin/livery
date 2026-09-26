import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {compileTenant, tokenSetToCss} from './compile.ts';
import type {TokenSource} from './model.ts';
import {BASE_TOKENS_FILE} from './node.ts';

const read = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const base: TokenSource = {name: 'base.tokens.json', json: read(BASE_TOKENS_FILE)};
const defaultTenant = (): Record<string, unknown> =>
  read(resolve(import.meta.dirname, '../../../tenants/harbour/tokens.json')) as Record<string, unknown>;

/** The default tenant plus one more file, to test what an edit to a tenant does. */
function compileWith(overrides: unknown) {
  const tenant = compileTenant('test', [
    base,
    {name: 'tenant.json', json: defaultTenant()},
    {name: 'edit.json', json: overrides},
  ]);
  return {...tenant, messages: tenant.problems.map((problem) => `${problem.path}: ${problem.message}`)};
}

const srgb = (hex: string, alpha?: number) => {
  const channel = (index: number) => parseInt(hex.slice(index, index + 2), 16) / 255;
  return {
    colorSpace: 'srgb',
    components: [channel(1), channel(3), channel(5)],
    ...(alpha === undefined ? {} : {alpha}),
  };
};

describe('compileTenant', () => {
  it('compiles a valid tenant with every contract token and every contrast pair', () => {
    const tenant = compileWith({});
    expect(tenant.problems).toEqual([]);
    expect(tenant.contrast.every((pair) => pair.passes)).toBe(true);
    expect(tenant.tokens.map((token) => token.cssVariable)).toContain('--color-text-default');
  });

  it('emits aliases of emitted tokens as var() and inlines primitives', () => {
    const tokens = new Map(compileWith({}).tokens.map((token) => [token.cssVariable, token]));
    expect(tokens.get('--button-primary-background')).toMatchObject({
      css: 'var(--color-brand-default)',
      resolvedCss: '#1c1917',
    });
    expect(tokens.get('--color-brand-default')).toMatchObject({css: '#1c1917'});
    expect([...tokens.keys()].some((name) => name.startsWith('--primitive') || name.includes('blue'))).toBe(false);
  });

  it('fails a tenant whose text does not reach WCAG AA', () => {
    // The original alpha theme's hover colour, with white text on it.
    const {messages} = compileWith({semantic: {color: {brand: {hover: {$type: 'color', $value: srgb('#06b6d4')}}}}});
    expect(messages).toEqual([
      'primary button label under the pointer: #ffffff (primitive.color.on-brand in tenant.json) on ' +
        '#06b6d4 (semantic.color.brand.hover in edit.json) is 2.43:1, WCAG AA needs 4.5:1',
    ]);
  });

  it('holds focus rings and control borders to 3:1', () => {
    const {messages} = compileWith({semantic: {color: {border: {strong: {$type: 'color', $value: srgb('#cbd5e1')}}}}});
    const where =
      '#cbd5e1 (semantic.color.border.strong in edit.json) on #ffffff (primitive.color.surface in tenant.json)';
    // Both controls drawn with the strong border fail, each reported under its own pair.
    expect(messages).toEqual([
      `secondary button border: ${where} is 1.48:1, WCAG AA needs 3:1`,
      `input border: ${where} is 1.48:1, WCAG AA needs 3:1`,
    ]);
  });

  it('refuses a translucent background, because contrast cannot be judged through it', () => {
    const {messages} = compileWith({semantic: {color: {canvas: {$type: 'color', $value: srgb('#ffffff', 0.5)}}}});
    expect(messages).toEqual(
      ['body text on the page', 'muted text on the page', 'links on the page', 'focus ring on the page'].map(
        (label) =>
          `semantic.color.canvas: must be opaque: it is the background of "${label}", and contrast cannot be judged through it`
      )
    );
  });

  it('keeps the semantic and component layers closed', () => {
    const {messages} = compileWith({
      semantic: {color: {text: {defualt: {$type: 'color', $value: srgb('#000000')}}}},
      component: {card: {radius: {$type: 'color', $value: srgb('#000000')}}},
      theme: {accent: {$type: 'color', $value: srgb('#000000')}},
    });
    expect(messages).toEqual([
      'theme.accent: tokens belong to one of the layers primitive, semantic, component',
      'component.card.radius: must be a dimension, not a color',
      'semantic.color.text.defualt: is not part of the contract; semantic and component tokens are a closed set',
    ]);
  });

  it('reports a missing contract token', () => {
    const tenant = defaultTenant();
    const semantic = tenant.semantic as {color: {link?: unknown}};
    delete semantic.color.link;
    const {problems} = compileTenant('test', [base, {name: 'tenant.json', json: tenant}]);
    expect(problems.map((problem) => `${problem.path}: ${problem.message}`)).toEqual([
      'component.button.secondary.text: refers to {semantic.color.link}, which does not exist',
      'semantic.color.link: is missing (links)',
    ]);
  });
});

describe('tokenSetToCss', () => {
  it('puts every emitted token on :root, keeping aliases as var()', () => {
    const css = tokenSetToCss(compileWith({}));
    expect(css.startsWith(':root{--color-canvas:#f4f4f2;')).toBe(true);
    expect(css).toContain('--button-primary-background:var(--color-brand-default);');
    expect(css).not.toContain('primitive');
  });
});
