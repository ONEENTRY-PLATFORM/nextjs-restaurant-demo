import { expect, test } from '@playwright/test';

// Any unknown top-level slug falls through to `app/[handle]/page.tsx`, which calls `notFound()` when
// the OneEntry page is missing → renders `app/not-found.tsx` with HTTP 404.
const UNKNOWN_ROUTE = '/__definitely_not_a_real_page_xyz__';

test.describe('404 / not-found', () => {
  test('unknown route responds with a 404 status', async ({ page }) => {
    const res = await page.goto(UNKNOWN_ROUTE, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
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
