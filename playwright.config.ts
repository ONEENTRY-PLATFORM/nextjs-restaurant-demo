import './tests/e2e/fixtures/loadEnv';

import { defineConfig, devices } from '@playwright/test';

// Full e2e runs against a production build, not `next dev`. Dev mode compiles per-request and
// leaks memory, so a full ~300-test run OOM-crashes the dev server mid-suite — every subsequent
// `page.goto` then fails with `net::ERR_CONNECTION_REFUSED` (and the mass-failure artifacts trip
// Playwright's trace/video zip packaging: "file data stream has unexpected number of bytes").
// `next start` serves the compiled app with stable memory, so the cascade disappears.
//
// Prod mode is gated on `npm_lifecycle_event` (set cross-platform by npm — no cross-env/dep needed):
// `npm run test:e2e:prod` → prod; a bare `npx playwright test` stays on dev:3000 for quick local
// runs that reuse an already-running `next dev`. CI and an explicit `PLAYWRIGHT_PROD` also force prod.
const PROD =
  process.env.npm_lifecycle_event === 'test:e2e:prod' ||
  !!process.env.PLAYWRIGHT_PROD ||
  !!process.env.CI;
// Prod e2e uses a dedicated port so Playwright's own server never collides with a `next dev`
// already listening on 3000.
const PORT = Number(process.env.PORT ?? (PROD ? 3100 : 3000));
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
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
        webServer: PROD
          ? {
              // Build once, then serve the compiled app. `npx next build` (not `npm run build`)
              // skips the `prebuild` jest hook. Build + cold start can take minutes — wide timeout.
              command: `npx next build && npx next start -p ${PORT}`,
              url: BASE_URL,
              reuseExistingServer: false,
              timeout: 600_000,
              stdout: 'pipe' as const,
              stderr: 'pipe' as const,
            }
          : {
              command: 'npm run dev',
              url: BASE_URL,
              reuseExistingServer: !process.env.CI,
              timeout: 180_000,
              stdout: 'pipe' as const,
              stderr: 'pipe' as const,
            },
      }),
});
