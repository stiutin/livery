import {cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {afterAll, describe, expect, it} from 'vitest';

import {BASE_TOKENS_FILE, compileTenantsFromDisk} from './node.ts';
import {
  brandFromSettings,
  checkBrand,
  decodeSettings,
  DEFAULT_SETTINGS,
  encodeSettings,
  type StudioSettings,
} from './studio.ts';

const base = {name: 'base.tokens.json', json: JSON.parse(readFileSync(BASE_TOKENS_FILE, 'utf8')) as unknown};
const repoTenants = resolve(import.meta.dirname, '../../../tenants');
const messages = (result: ReturnType<typeof checkBrand>) => result.problems.map((problem) => problem.message);

describe('share links', () => {
  it('round-trip every setting', () => {
    const settings: StudioSettings = {
      ...DEFAULT_SETTINGS,
      id: 'nordlicht',
      name: 'Nordlicht – Grün',
      color: '#0f766e',
      mode: 'dark',
      font: 'serif',
      radius: 4,
      pill: true,
      density: 'compact',
      locale: 'de-DE',
      currency: 'EUR',
      payments: false,
    };
    const encoded = encodeSettings(settings);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSettings(encoded)).toEqual(settings);
  });

  it('fall back to the defaults for anything broken', () => {
    expect(decodeSettings('not base64 at all!')).toEqual(DEFAULT_SETTINGS);
    const partly = encodeSettings({...DEFAULT_SETTINGS, radius: 400, color: 'red'});
    expect(decodeSettings(partly)).toMatchObject({radius: DEFAULT_SETTINGS.radius, color: DEFAULT_SETTINGS.color});
  });
});

describe('checkBrand', () => {
  it('passes the default brand in light and dark', () => {
    expect(messages(checkBrand(DEFAULT_SETTINGS, base))).toEqual([]);
    expect(messages(checkBrand({...DEFAULT_SETTINGS, mode: 'dark'}, base))).toEqual([]);
  });

  it('turns the choices into tokens', () => {
    const {tokenSet} = checkBrand(
      {...DEFAULT_SETTINGS, pill: true, density: 'spacious', font: 'mono', radius: 6},
      base
    );
    const css = new Map(tokenSet.tokens.map((token) => [token.cssVariable, token.css]));
    expect(css.get('--button-radius')).toBe('9999px');
    expect(css.get('--density')).toBe('1.15');
    expect(css.get('--radius-medium')).toBe('6px');
    expect(css.get('--font-family-body')).toContain('monospace');
    // The brand colour itself is kept, in OKLCH.
    expect(css.get('--color-brand-default')).toMatch(/^oklch\(/);
  });

  it('reports an id that is taken, reserved or malformed', () => {
    expect(messages(checkBrand(DEFAULT_SETTINGS, base, ['aurora']))).toEqual([
      'a tenant called "aurora" already exists',
    ]);
    expect(messages(checkBrand({...DEFAULT_SETTINGS, id: 'studio'}, base))).toEqual([
      '"studio" is the address of one of Livery\'s own pages',
    ]);
    expect(messages(checkBrand({...DEFAULT_SETTINGS, id: 'My Brand'}, base))[0]).toContain('cannot be a tenant id');
  });

  it('reports contrast it cannot fix, with the colour to change', () => {
    // A muddy mid-tone: neither white nor near-black text reaches 4.5:1 on it.
    const problems = messages(checkBrand({...DEFAULT_SETTINGS, color: '#957350'}, base));
    expect(problems.length).toBeGreaterThan(0);
    for (const problem of problems) {
      expect(problem).toContain('primitive.color.brand.base in tokens.json');
    }
  });
});

describe('a brand exported from Studio', () => {
  const root = mkdtempSync(join(tmpdir(), 'livery-studio-'));
  afterAll(() => {
    rmSync(root, {recursive: true, force: true});
  });

  it('builds without touching any code, for colours all round the wheel', () => {
    cpSync(repoTenants, join(root, 'tenants'), {recursive: true});
    const exported: string[] = [];
    let index = 0;

    for (const mode of ['light', 'dark'] as const) {
      for (let hue = 0; hue < 360; hue += 30) {
        index += 1;
        const color = `#${[0, 8, 4]
          .map((n) => {
            const k = (n + hue / 30) % 12;
            const a = 0.6 * Math.min(0.45, 0.55);
            return Math.round(255 * (0.45 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
              .toString(16)
              .padStart(2, '0');
          })
          .join('')}`;
        const settings: StudioSettings = {
          ...DEFAULT_SETTINGS,
          id: `studio-brand-${index}`,
          name: `Brand ${index}`,
          color,
          mode,
          font: (['system', 'humanist', 'rounded', 'serif', 'mono'] as const)[index % 5] ?? 'system',
          pill: index % 2 === 0,
          density: (['compact', 'regular', 'spacious'] as const)[index % 3] ?? 'regular',
        };
        if (checkBrand(settings, base).problems.length > 0) {
          continue;
        }
        const {tenantJson, tokensJson} = brandFromSettings(settings);
        mkdirSync(join(root, 'tenants', settings.id));
        writeFileSync(join(root, 'tenants', settings.id, 'tenant.json'), JSON.stringify(tenantJson, null, 2));
        writeFileSync(join(root, 'tenants', settings.id, 'tokens.json'), JSON.stringify(tokensJson, null, 2));
        exported.push(settings.id);
      }
    }

    // Almost every colour is exportable; the rest are refused in Studio before they reach a build.
    expect(exported.length).toBeGreaterThanOrEqual(22);
    const result = compileTenantsFromDisk({root, tenantsDir: join(root, 'tenants'), defaultTenant: 'harbour'});
    expect(result.report).toBe('');
    expect(result.tenants.map((tenant) => tenant.id)).toEqual(expect.arrayContaining(exported));
  });
});
