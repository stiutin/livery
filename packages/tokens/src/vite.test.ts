import {cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {build} from 'vite';
import {afterEach, describe, expect, it} from 'vitest';

import {liveryTokens} from './vite.ts';

const repoTenants = resolve(import.meta.dirname, '../../../tenants');
const directories: string[] = [];

/** A throwaway app that imports both virtual modules, with a copy of the repository's tenants. */
function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'livery-tokens-'));
  directories.push(root);
  cpSync(repoTenants, join(root, 'tenants'), {recursive: true});
  writeFileSync(join(root, 'index.html'), '<script type="module" src="./main.js"></script>');
  writeFileSync(
    join(root, 'main.js'),
    "import {loadTenant} from 'virtual:livery/tenants';\nconst tenant = await loadTenant('tenant-alpha');\nconsole.log(tenant?.css);\n"
  );
  return root;
}

function buildApp(root: string) {
  return build({
    root,
    logLevel: 'silent',
    configFile: false,
    plugins: [liveryTokens({root, tenantsDir: join(root, 'tenants'), defaultTenant: 'tenant-default'})],
    build: {outDir: join(root, 'dist'), target: 'es2022'},
  });
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {recursive: true, force: true});
  }
});

describe('liveryTokens', () => {
  it('builds one chunk per tenant, each with its own CSS', async () => {
    const root = fixture();
    await buildApp(root);

    const chunks = readdirSync(join(root, 'dist', 'assets')).map((file) =>
      readFileSync(join(root, 'dist', 'assets', file), 'utf8')
    );
    const withBrand = (hex: string) => chunks.filter((chunk) => chunk.includes(`--color-brand-default:${hex};`));
    expect(withBrand('#5b21b6')).toHaveLength(1);
    expect(withBrand('#0f766e')).toHaveLength(1);
    // The alpha chunk carries only alpha's tokens.
    expect(withBrand('#5b21b6')[0]).not.toContain('#0f766e');
  });

  it('fails the build when a tenant falls below WCAG AA', async () => {
    const root = fixture();
    const file = join(root, 'tenants', 'tenant-alpha', 'tokens.json');
    const tokens = JSON.parse(readFileSync(file, 'utf8')) as {primitive: {color: Record<string, {$value: unknown}>}};
    // Give alpha a light hover colour: white text on it drops to about 2.4:1.
    tokens.primitive.color['brand-700'] = {$value: {colorSpace: 'srgb', components: [6 / 255, 182 / 255, 212 / 255]}};
    writeFileSync(file, JSON.stringify(tokens));

    await expect(buildApp(root)).rejects.toThrow(
      /tenant-alpha › contrast › primary button label under the pointer: .*primitive\.color\.brand-700 in tenants\/tenant-alpha\/tokens\.json\) is 2\.4\d:1/
    );
  });
});
