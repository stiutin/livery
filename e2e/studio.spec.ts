import {execFileSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {expect, type Page, test} from '@playwright/test';

import {trackErrors} from './helpers';

const REPOSITORY = resolve(import.meta.dirname, '..');
const preview = (page: Page) => page.locator('[data-studio-preview]');
const previewToken = (page: Page, name: string) =>
  preview(page).evaluate((element, token) => getComputedStyle(element).getPropertyValue(token).trim(), name);

async function describeBrand(page: Page, {id, name, color}: {id: string; name: string; color: string}) {
  const settings = page.getByRole('form', {name: 'Brand settings'});
  await settings.getByLabel('Name', {exact: true}).fill(name);
  await settings.getByLabel('Id', {exact: true}).fill(id);
  await settings.getByLabel('Brand colour', {exact: true}).fill(color);
}

test('Studio previews the real pages in the brand being made', async ({page}) => {
  const errors = trackErrors(page);
  await page.goto('./studio');

  await expect(page.getByRole('status').filter({hasText: 'contrast pairs pass'})).toContainText('All 21');
  await expect(preview(page).getByRole('heading', {level: 1, name: 'Welcome to Aurora'})).toBeVisible();

  await describeBrand(page, {id: 'nordlicht', name: 'Nordlicht', color: '#0f766e'});
  await page.getByRole('form', {name: 'Brand settings'}).getByLabel('Mode').selectOption('dark');

  await expect(preview(page).getByRole('heading', {level: 1, name: 'Welcome to Nordlicht'})).toBeVisible();
  expect(await previewToken(page, '--color-brand-default')).toMatch(/^oklch\(/);
  expect(await previewToken(page, '--color-canvas')).toMatch(/^oklch\(0\.17 /);
  // Only the preview changes: the Studio page keeps the default tenant's look.
  await expect(page.locator('html')).toHaveAttribute('data-tenant', 'harbour');
  expect(errors).toEqual([]);
});

test('links inside the preview move between preview pages, not the Studio page', async ({page}) => {
  await page.goto('./studio');
  const url = page.url();

  await preview(page).getByRole('link', {name: 'Sign in'}).first().click();
  await expect(preview(page).getByRole('heading', {level: 1, name: 'Sign in to Aurora'})).toBeVisible();
  expect(page.url()).toBe(url);

  await page.getByRole('group', {name: 'Preview page'}).getByRole('button', {name: 'Components'}).click();
  await expect(preview(page).getByRole('table', {name: 'Semantic colours of aurora'})).toBeVisible();

  await page.getByLabel('Preview language').selectOption('de');
  await expect(preview(page).getByRole('heading', {name: 'Schaltflächen'})).toBeVisible();
});

test('the address is a share link that restores every choice', async ({page, context}) => {
  await page.goto('./studio');
  await describeBrand(page, {id: 'sol', name: 'Sol', color: '#b45309'});
  await page.getByRole('form', {name: 'Brand settings'}).getByLabel('Pill-shaped buttons').check();
  await expect(page).toHaveURL(/#.+/);

  const shared = await context.newPage();
  await shared.goto(page.url());
  const settings = shared.getByRole('form', {name: 'Brand settings'});
  await expect(settings.getByLabel('Name', {exact: true})).toHaveValue('Sol');
  await expect(settings.getByLabel('Brand colour', {exact: true})).toHaveValue('#b45309');
  await expect(settings.getByLabel('Pill-shaped buttons')).toBeChecked();
  expect(await previewToken(shared, '--button-radius')).toBe('9999px');
});

test('a brand that fails contrast cannot be exported, and says why', async ({page}) => {
  await page.goto('./studio');
  await page.getByRole('form', {name: 'Brand settings'}).getByLabel('Brand colour', {exact: true}).fill('#957350');

  await expect(page.getByRole('status').filter({hasText: 'to fix before export'})).toBeVisible();
  await expect(page.getByText(/primitive\.color\.brand\.base in tokens\.json/).first()).toBeVisible();
  await expect(page.getByRole('button', {name: 'Download tokens.json'})).toBeDisabled();
});

test('an exported brand builds with no code changes', async ({page}) => {
  await page.goto('./studio');
  await describeBrand(page, {id: 'nordlicht', name: 'Nordlicht', color: '#0f766e'});
  await page.getByRole('form', {name: 'Brand settings'}).getByLabel('Mode').selectOption('dark');

  const root = mkdtempSync(join(tmpdir(), 'livery-studio-e2e-'));
  try {
    cpSync(join(REPOSITORY, 'tenants'), join(root, 'tenants'), {recursive: true});
    mkdirSync(join(root, 'tenants', 'nordlicht'));
    for (const file of ['tenant.json', 'tokens.json']) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', {name: `Download ${file}`}).click(),
      ]);
      expect(download.suggestedFilename()).toBe(file);
      await download.saveAs(join(root, 'tenants', 'nordlicht', file));
    }

    // The same function the Vite plugin runs at build time, on the repository's tenants plus the export.
    const script = `
      import {compileTenantsFromDisk} from ${JSON.stringify(join(REPOSITORY, 'packages/tokens/src/node.ts'))};
      const result = compileTenantsFromDisk({root: ${JSON.stringify(root)}, tenantsDir: ${JSON.stringify(join(root, 'tenants'))}, defaultTenant: 'harbour'});
      console.log(JSON.stringify({report: result.report, tenants: result.tenants.map((tenant) => tenant.id)}));
    `;
    const output = JSON.parse(execFileSync('node', ['--input-type=module', '-e', script], {encoding: 'utf8'})) as {
      report: string;
      tenants: string[];
    };
    expect(output.report).toBe('');
    expect(output.tenants).toContain('nordlicht');
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
