import { expect, test } from '@playwright/test';

import { dismissCookieBanner, gotoAndReady, isMobile } from './fixtures/helpers';

test.describe('Home page', () => {
  test('loads without errors and shows the slogan', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', err => consoleErrors.push(err.message));

    await gotoAndReady(page, '/');

    await expect(page).toHaveTitle(/.+/);

    if (!isMobile(page)) {
      await expect(page.getByText(/Excellent taste/i)).toBeVisible();
    }

    const home = await page
      .locator('#header')
      .isVisible()
      .catch(() => false);
    expect(home).toBeTruthy();

    expect(consoleErrors, `page errors: ${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('header contains a logo linking back to home', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    // The desktop header logo stays in the DOM (CSS-hidden) on mobile and precedes the visible
    // mobile logo, so filter to the visible one before asserting/clicking.
    const logoLink = page
      .locator('header a[href="/"], #header a[href="/"]')
      .filter({ visible: true })
      .first();
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await page.waitForURL(u => u.pathname === '/' || u.pathname === '');
  });

  test('catalog opens from the navigation', async ({ page }) => {
    await gotoAndReady(page, '/');

    if (isMobile(page)) {
      const burger = page.getByRole('button', { name: /menu|burger/i }).first();
      if (await burger.isVisible().catch(() => false)) {
        await burger.click();
      }
    }

    // Many such links exist in the DOM (header drawers, off-screen). Read the href of the first
    // "View all" link inside `<main>` and navigate directly — this verifies the link target without
    // dealing with scroll/viewport quirks.
    const menuLink = page
      .locator(
        'main a[href^="/shop/category/"], main a[href*="/restaurants"], main a[href*="/blog"]'
      )
      .first();
    await expect(menuLink).toBeVisible({ timeout: 15_000 });
    const href = await menuLink.getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await expect(page).toHaveURL(/\/(shop|restaurants|blog)/);
  });

  test('DOM has no multipart prerender artifacts (Next 16.2.6 bug)', async ({ page }) => {
    await gotoAndReady(page, '/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/^--[a-f0-9]{16,}/m);
    expect(bodyText).not.toMatch(/content-type:\s*text\/html/i);
    await dismissCookieBanner(page);
  });
});

test.describe('Home — category "View all" links', () => {
  // Category sections animate in after hydration; first paint may have zero matching nodes for
  // a few hundred ms. We retry the locator count until either at least one section appears or
  // the generous timeout expires — only then do we treat "no sections" as a real empty catalog.
  const SECTION_SETTLE_MS = 30_000;

  test('every category section has a View all link pointing at /shop/category/<marker>', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');

    // Two homepage blocks render `<section class="section_layout">`: `HomeBlockSection`
    // (Recommended — no View all) and `CategoriesSection` (Soups / Mains / … — with View all).
    // Iterate over the View all links directly so we naturally skip the Recommended block.
    const links = page.locator('section.section_layout .title a[href^="/shop/category/"]');
    await expect(links.first()).toBeVisible({ timeout: SECTION_SETTLE_MS });

    const count = await links.count();
    expect(count, 'home should render at least one category View all link').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href, `View all link #${i} href`).toMatch(/^\/shop\/category\/[^/?#]+$/);
      // Format the label is `View all ({count})` — see CategoriesSection (`view_all_text` dictionary).
      // Don't pin the exact label to a locale; just assert it contains a digit count in parens.
      await expect(link).toHaveText(/\(\s*\d+\s*\)/);
    }
  });

  test('clicking View all navigates to the category page', async ({ page }) => {
    await gotoAndReady(page, '/');

    const viewAll = page
      .locator('section.section_layout .title a[href^="/shop/category/"]')
      .first();
    await expect(viewAll).toBeVisible({ timeout: SECTION_SETTLE_MS });

    const href = await viewAll.getAttribute('href');
    expect(href).toMatch(/^\/shop\/category\/[^/?#]+$/);

    await viewAll.click();
    await page.waitForURL(new RegExp(href!.replace(/\//g, '\\/')));

    // Category route renders the catalog grid (`.menu_items` / `.menu_item`). The skeleton loader
    // (`ProductsGridLoader`) also emits a `.menu_items` inside an `aria-hidden="true"` section and
    // can linger on slower engines (webkit), so scope to the real, non-aria-hidden grid to avoid a
    // strict-mode match on two `.menu_items`.
    const grid = page
      .locator('section.products_grid_layout:not([aria-hidden="true"]) .menu_items')
      .first();
    await expect(grid).toBeVisible({ timeout: 20_000 });
    await expect(grid.locator('.menu_item').first()).toBeVisible();
  });

  test('View all targets a section-specific marker (not all linking to the same page)', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');

    const links = page.locator('section.section_layout .title a[href^="/shop/category/"]');
    // Wait for the second link to attach before counting — otherwise pre-hydration paint shows 0/1
    // and the test mis-skips. If only one section ever appears, the catalog genuinely has one
    // category and the uniqueness assertion is moot.
    await expect(links.nth(1))
      .toBeAttached({ timeout: SECTION_SETTLE_MS })
      .catch(() => undefined);
    const count = await links.count();
    test.skip(count < 2, 'fewer than two category sections — uniqueness check is moot');

    const hrefs = await links.evaluateAll(els =>
      els.map(el => (el as HTMLAnchorElement).getAttribute('href') ?? '')
    );
    expect(new Set(hrefs).size, 'View all links should target distinct categories').toBe(
      hrefs.length
    );
  });
});
