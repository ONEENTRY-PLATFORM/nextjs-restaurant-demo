import { expect, test } from '@playwright/test';

// Any unknown top-level slug falls through to `app/[handle]/page.tsx`, which calls `notFound()` →
// renders `app/not-found.tsx`. On routes under a `loading.tsx` boundary Next 16 flushes a 200 shell
// before `notFound()` resolves, so the status is a soft-404 (200), not a hard 404. The behaviour that
// matters is that the not-found view renders, so assert the UI, not the code.
const UNKNOWN_ROUTE = '/__definitely_not_a_real_page_xyz__';

test.describe('404 / not-found', () => {
  test('unknown route renders the not-found view', async ({ page }) => {
    const res = await page.goto(UNKNOWN_ROUTE, { waitUntil: 'domcontentloaded' });
    // Soft-404 (200) or hard 404 are both acceptable; the regression we guard against is a 5xx or a
    // wrongly-rendered real page.
    expect([200, 404]).toContain(res?.status());

    const returnHome = page
      .getByRole('link', { name: /return home/i })
      .filter({ visible: true })
      .first();
    await expect(returnHome).toBeVisible({ timeout: 15_000 });
  });

  test('the 404 view offers a working return-home link', async ({ page }) => {
    await page.goto(UNKNOWN_ROUTE, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    // Both branches of `not-found.tsx` (CMS-driven and the fallback shell) render the
    // `return_home_button` CTA. The dictionary is unreadable anonymously (SSR falls back to the
    // compiled default "Return home"), so the label is stable for the e2e run.
    const returnHome = page
      .getByRole('link', { name: /return home/i })
      .filter({ visible: true })
      .first();
    await expect(returnHome).toBeVisible({ timeout: 15_000 });

    await returnHome.click();
    await page.waitForURL(u => u.pathname === '/' || u.pathname === '');
  });
});
