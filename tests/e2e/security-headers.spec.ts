import { expect, test } from '@playwright/test';

// Locks in the hardening headers declared in `next.config.ts` and the ISR cache
// header that only a production server emits. Both are invisible in the UI, so
// nothing else in the suite would notice if a config edit dropped them — which
// is exactly why they need a test rather than a code review.
//
// Runs against the production e2e server; in dev mode Next serves no
// `x-nextjs-cache`, so that assertion is skipped rather than made to lie.
//
// The flag mirrors `playwright.config.ts` exactly — it decides PROD the same
// three ways, and a guard that disagreed with it would skip the assertion in
// the very run that can make it.
const IS_PROD_SERVER =
  process.env.npm_lifecycle_event === 'test:e2e:prod' ||
  Boolean(process.env.PLAYWRIGHT_PROD) ||
  Boolean(process.env.CI);

/** Every response passes through the `/:path*` rule, so one page proves them all. */
test('every hardening header is served', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'homepage response').not.toBeNull();
  const headers = response!.headers();

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['permissions-policy']).toContain('camera=()');
  expect(headers['strict-transport-security']).toContain('max-age=31536000');
});

test('the framework is not advertised', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'homepage response').not.toBeNull();
  // `poweredByHeader: false` in next.config.ts.
  expect(response!.headers()['x-powered-by']).toBeUndefined();
});

test('the CSP keeps its load-bearing directives', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'homepage response').not.toBeNull();
  const csp = response!.headers()['content-security-policy'];
  expect(csp, 'CSP header must be present').toBeTruthy();

  // Deliberately conservative: this policy does not restrict script/img/connect
  // (that needs a nonce-based middleware setup). What it does cover must hold.
  expect(csp).toContain("frame-ancestors 'self'");
  expect(csp).toContain("base-uri 'self'");
  expect(csp).toContain("object-src 'none'");
  // Checkout posts to Stripe — dropping this origin silently breaks payment.
  expect(csp).toContain('https://checkout.stripe.com');
});

test('no page trips its own policy', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (/content security policy|refused to (load|connect|apply|execute)/i.test(text)) {
      violations.push(text);
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(violations, 'CSP violations on the homepage').toEqual([]);
});

test('prerendered pages are served from the ISR cache, not re-rendered per request', async ({
  page,
}) => {
  test.skip(!IS_PROD_SERVER, 'x-nextjs-cache is only emitted by a production server');

  // The first hit may be a MISS on a cold server; the second must come from the
  // cache. Asserting the header exists at all is the point — its absence means
  // the route quietly went dynamic and every visitor pays for a CMS round-trip.
  await page.goto('/');
  const second = await page.goto('/');
  expect(second, 'second homepage response').not.toBeNull();

  const cacheHeader = second!.headers()['x-nextjs-cache'];
  expect(cacheHeader, 'x-nextjs-cache must be present on a prerendered route').toBeDefined();
  expect(['HIT', 'STALE']).toContain(cacheHeader);
});
