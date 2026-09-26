import {readdir, rename, rm} from 'node:fs/promises';
import {dirname, join, relative, resolve} from 'node:path';

import {compileTenantsFromDisk} from '@livery/tokens/node';
import type {Config} from '@react-router/dev/config';

import {PAGES_BASE, TENANT_OPTIONS} from './livery.config';
import {prerenderPaths} from './src/tenantPaths';

async function removeEmptyDirectories(directory: string): Promise<void> {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (entry.isDirectory()) {
      const path = join(directory, entry.name);
      await removeEmptyDirectories(path);
      if ((await readdir(path)).length === 0) {
        await rm(path, {recursive: true});
      }
    }
  }
}

/** Every `…/index.html` below the root, as paths relative to it. */
async function nestedIndexFiles(root: string, directory = root): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await nestedIndexFiles(root, path)));
    } else if (entry.name === 'index.html' && directory !== root) {
      found.push(relative(root, path));
    }
  }
  return found;
}

export default {
  appDirectory: 'src',
  basename: PAGES_BASE,
  // No server: every known URL is rendered to HTML at build time, anything else gets the client-side 404.
  ssr: false,
  prerender: () => prerenderPaths(compileTenantsFromDisk(TENANT_OPTIONS).tenants.map((tenant) => tenant.id)),

  /**
   * Shapes build/client into what GitHub Pages serves under the base path:
   *
   * 1. React Router writes the client-rendered shell (for URLs it did not prerender) to index.html at the top;
   *    it becomes 404.html, which Pages returns, with status 404, for any unknown path.
   * 2. Prerendered pages and their .data files are written below the basename (livery/…); they move up, since
   *    the deployed folder already is /livery/.
   * 3. Pages answers /tenant-alpha/auth/login with tenant-alpha/auth/login.html directly, but with a redirect
   *    when only tenant-alpha/auth/login/index.html exists, so nested index files become <path>.html.
   */
  async buildEnd({reactRouterConfig}) {
    const client = resolve(reactRouterConfig.buildDirectory, 'client');
    await rename(join(client, 'index.html'), join(client, '404.html'));

    const prerendered = join(client, reactRouterConfig.basename.replace(/^\/|\/$/g, ''));
    if (prerendered !== client) {
      for (const name of await readdir(prerendered)) {
        await rename(join(prerendered, name), join(client, name));
      }
      await rm(prerendered, {recursive: true});
    }

    for (const file of await nestedIndexFiles(client)) {
      await rename(join(client, file), `${join(client, dirname(file))}.html`);
    }
    await removeEmptyDirectories(client);
  },
} satisfies Config;
