import {defineConfig, devices} from '@playwright/test';

const APP_PORT = 4173;
const BASE_PATH = process.env.BASE_PATH ?? '/livery/';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {name: 'desktop', use: {...devices['Desktop Chrome']}},
    {name: 'mobile', use: {...devices['Pixel 7']}},
  ],
  reporter: process.env.CI ? [['github'], ['html', {open: 'never'}]] : 'list',
  retries: process.env.CI ? 1 : 0,
  testDir: 'e2e',
  use: {
    baseURL: `http://localhost:${APP_PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
    launchOptions: {executablePath: process.env.CHROMIUM_PATH ?? undefined},
  },
  webServer: {
    command: 'npm run serve',
    url: `http://localhost:${APP_PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
  },
});
