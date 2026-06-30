import { expect, type Page, test } from '@playwright/test';

/**
 * gotoPromotionsOrSkip — navigates to `/promotions` and skips the test when the OneEntry `promotions` page is absent (404).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `/promotions` has loaded; otherwise the test is skipped.
 */
const gotoPromotionsOrSkip = async (page: Page): Promise<void> => {
  const res = await page.goto('/promotions', { waitUntil: 'domcontentloaded' });
  if (res?.status() === 404) {
    test.skip(true, 'OneEntry `promotions` page is not configured (404)');
  }
  await page.waitForLoadState('networkidle').catch(() => undefined);
};

test.describe('Promotions list (/promotions)', () => {
  test('renders the breadcrumb and a non-empty title', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await gotoPromotionsOrSkip(page);

    const crumbs = page.locator('nav[aria-label="Breadcrumbs"]');
    await expect(crumbs).toBeVisible({ timeout: 15_000 });
    await expect(crumbs.getByRole('link', { name: /^home$/i })).toBeVisible();

    const title = page.locator('section.section_layout h1').first();
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();

    expect(errors, `page errors: ${errors.join('\n')}`).toEqual([]);
  });

  test('breadcrumb Home link returns to the home page', async ({ page }) => {
    await gotoPromotionsOrSkip(page);

    await page
      .locator('nav[aria-label="Breadcrumbs"]')
      .getByRole('link', { name: /^home$/i })
      .click();
    await page.waitForURL(u => u.pathname === '/' || u.pathname === '');
  });

  test('promo banners link to /promotions/<handle> and open the promo detail page', async ({
    page,
  }) => {
    await gotoPromotionsOrSkip(page);

    // Banners render as `<Link href="/promotions/<pageUrl>">` wrapping an `<Image>` (no text). A banner
    // without a `pageUrl` falls back to `href="#"`, so anchoring on the `/promotions/` prefix also filters
    // those out.
    const banners = page.locator('section.section_layout a[href^="/promotions/"]');
    if ((await banners.count()) === 0) {
      test.skip(true, 'no promo banners configured under `promotions`');
    }

    const first = banners.first();
    const href = await first.getAttribute('href');
    expect(href).toMatch(/^\/promotions\/[^/?#]+$/);

    await first.click();
    await page.waitForURL(/\/promotions\/[^/?#]+$/);

    // Promo detail breadcrumb carries three levels (Home / Promotions / <title>); the current page is
    // the only `<li aria-current="page">`.
    const crumbs = page.locator('nav[aria-label="Breadcrumbs"]');
    await expect(crumbs).toBeVisible({ timeout: 15_000 });
    await expect(crumbs.locator('li[aria-current="page"]')).toBeVisible();
    await expect(page.locator('section.section_layout h1').first()).not.toBeEmpty();
  });
});
