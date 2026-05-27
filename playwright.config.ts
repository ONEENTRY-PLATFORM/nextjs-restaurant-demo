import './e2e/fixtures/loadEnv';

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI runs two workers; locally Playwright otherwise auto-scales to ~half the CPU cores, which
  // is murder on a dev box that also has Next's dev server compiling per request — pin to a single
  // worker so `npx playwright test` / `--ui` mode runs tests one at a time.
  // `workers` is conditionally spread instead of set to `undefined`: tsconfig has
  // `exactOptionalPropertyTypes: true`, which rejects `undefined` for `string | number`.
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',

  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    // Next dev mode compiles pages on first hit; `app/page.tsx` and `app/support/page.tsx` use
    // `force-dynamic`, so each route is re-rendered per request. Cold compiles on a slow disk can
    // exceed 30s — bump the navigation budget to 90s to ride out the warm-up.
    navigationTimeout: 90_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  // `webServer` is conditionally spread instead of set to `undefined`: tsconfig has
  // `exactOptionalPropertyTypes: true`, so an explicit `undefined` is not assignable to
  // `TestConfigWebServer`.
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          stdout: 'pipe' as const,
          stderr: 'pipe' as const,
        },
      }),
});
