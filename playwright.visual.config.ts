import {defineConfig} from '@playwright/test';

import base from './playwright.config';

/**
 * Screenshot comparison, run apart from the functional suite because the baselines are only valid in the
 * Playwright container (fonts and rendering differ between machines). CI runs it in that container, and
 * `npm run e2e:visual:update` runs there too, in the same CI job (see .github/workflows/ci.yml).
 */
export default defineConfig({
  ...base,
  testDir: 'e2e/visual',
  testIgnore: [],
  snapshotPathTemplate: 'e2e/visual/__screenshots__/{projectName}/{arg}{ext}',
  expect: {toHaveScreenshot: {maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide'}},
});
