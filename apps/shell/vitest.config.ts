import {liveryTokens} from '@livery/tokens/vite';
import {defineConfig} from 'vitest/config';

import {TENANT_OPTIONS} from './livery.config';

// Pages are tested as components, without React Router's framework plugin; the tokens plugin still runs,
// so a broken tenant fails these tests too.
export default defineConfig({
  plugins: [liveryTokens(TENANT_OPTIONS)],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
