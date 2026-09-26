import {copyFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

import {liveryTokens} from '@livery/tokens/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, type Plugin} from 'vite';

/** Where GitHub Pages serves the site: /<repository>/. CI passes the real name, so a renamed fork still works. */
const PAGES_BASE = process.env.BASE_PATH ?? '/livery/';
const REPOSITORY = resolve(import.meta.dirname, '../..');

/**
 * GitHub Pages answers unknown paths with 404.html. A copy of index.html there lets a deep link such as
 * /livery/auth/login boot the app, and the router takes over.
 */
function spaFallback(): Plugin {
  return {
    name: 'livery:spa-fallback',
    apply: 'build',
    writeBundle({dir}) {
      if (dir) {
        copyFileSync(join(dir, 'index.html'), join(dir, '404.html'));
      }
    },
  };
}

export default defineConfig(({command}) => ({
  base: command === 'build' ? PAGES_BASE : '/',
  plugins: [
    react(),
    // Every tenant's design tokens, compiled and checked for contrast; a failing tenant stops the build.
    liveryTokens({root: REPOSITORY, tenantsDir: join(REPOSITORY, 'tenants'), defaultTenant: 'tenant-default'}),
    spaFallback(),
  ],
  resolve: {
    tsconfigPaths: true,
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
  },
}));
