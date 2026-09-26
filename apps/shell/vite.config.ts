import {liveryTokens} from '@livery/tokens/vite';
import {reactRouter} from '@react-router/dev/vite';
import {defineConfig} from 'vite';

import {PAGES_BASE, SITE_ORIGIN, TENANT_OPTIONS} from './livery.config';

export default defineConfig({
  // The same base in development, so local URLs match GitHub Pages: http://localhost:5173/livery/.
  base: PAGES_BASE,
  define: {
    'import.meta.env.VITE_SITE_ORIGIN': JSON.stringify(SITE_ORIGIN),
  },
  plugins: [
    reactRouter(),
    // Every tenant's settings and design tokens, validated and compiled; a failing tenant stops the build.
    liveryTokens(TENANT_OPTIONS),
  ],
  resolve: {
    tsconfigPaths: true,
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // One stylesheet instead of one per chunk: fewer render-blocking requests before the first paint.
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
  },
});
