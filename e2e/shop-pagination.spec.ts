import { expect, test } from '@playwright/test';

import { gotoAndReady } from './fixtures/helpers';

// Real catalog cards live in the (non-aria-hidden) grid that is a DIRECT child of the products
// section. This excludes (a) the `ProductsGridLoader` skeleton — its own `section` is `aria-hidden`,
// (b) the `ProductsGridReveal` overlay — same aria-hidden skeleton section, and (c) the `LoadMore`
// pending skeleton — an `aria-hidden` `.menu_items` nested deeper (not a direct child of the section).
const REAL_CARDS =
  'section.products_grid_layout:not([aria-hidden="true"]) > .menu_items > .menu_item';
const REAL_GRID = 'section.products_grid_layout:not([aria-hidden="true"]) > .menu_items';

test.describe('Catalog pagination (LoadMore)', () => {
  test('LoadMore appends ?page=2 and grows the grid when there is more than one page', async ({
    page,
  }) => {
    await gotoAndReady(page, '/shop');

    await expect(page.locator(REAL_GRID).first()).toBeVisible({ timeout: 20_000 });
    const cards = page.locator(REAL_CARDS);
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const initial = await cards.count();

    // `LoadMore` only renders when `totalPages > 1` (more than SHOP_PAGE_LIMIT=8 products). A single
    // page is not a bug — skip rather than fail.
    const loadMore = page.locator('button[aria-label="Load more"]');
    if ((await loadMore.count()) === 0) {
      test.skip(true, 'catalog fits on a single page (≤ 8 products) — no LoadMore to exercise');
    }

    // The button auto-triggers on scroll (GSAP ScrollTrigger) and is also a manual click target.
    // Scroll it into view AND click — whichever fires first wins; both push `?page=2`. Tolerate the
    // click missing: once the transition is pending the button re-renders into a skeleton and detaches.
    await loadMore
      .first()
      .scrollIntoViewIfNeeded()
      .catch(() => undefined);
    await loadMore
      .first()
      .click({ timeout: 5_000 })
      .catch(() => undefined);

    await page.waitForURL(u => u.searchParams.get('page') === '2', { timeout: 20_000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    // Page 2 fetches `limit = 2 * 8 = 16`, so the grid grows past the first page and is capped at 16.
    await expect
      .poll(() => page.locator(REAL_CARDS).count(), { timeout: 20_000 })
      .toBeGreaterThan(initial);
    expect(await page.locator(REAL_CARDS).count()).toBeLessThanOrEqual(16);
  });
});

test.describe('Category page (/shop/category/<handle>)', () => {
  test('injects BreadcrumbList JSON-LD and renders the grid', async ({ page }) => {
    await gotoAndReady(page, '/');

    // Derive a real category handle from a home "View all" link rather than hard-coding a marker.
    const viewAll = page
      .locator('section.section_layout .title a[href^="/shop/category/"]')
      .first();
    const ok = await viewAll.isVisible({ timeout: 30_000 }).catch(() => false);
    test.skip(!ok, 'home renders no category sections — cannot derive a category handle');

    const href = await viewAll.getAttribute('href');
    expect(href).toMatch(/^\/shop\/category\/[^/?#]+$/);
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    // The category route injects a BreadcrumbList with three items (Home / Shop / <category>).
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const txt = await scripts.nth(i).textContent();
      try {
        const parsed = JSON.parse(txt ?? '{}') as {
          '@type'?: string;
          itemListElement?: unknown[];
        };
        if (
          parsed['@type'] === 'BreadcrumbList' &&
          Array.isArray(parsed.itemListElement) &&
          parsed.itemListElement.length === 3
        ) {
          found = true;
          break;
        }
      } catch {
        /* not the breadcrumb script */
      }
    }
    expect(found, 'category page should inject a 3-item BreadcrumbList JSON-LD').toBeTruthy();

    await expect(page.locator(REAL_GRID).first()).toBeVisible({ timeout: 20_000 });
  });

  test('unknown category handle returns 404', async ({ page }) => {
    const res = await page.goto('/shop/category/__no_such_category_xyz__', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBe(404);
  });
});
