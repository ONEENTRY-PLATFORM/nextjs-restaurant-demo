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

    // `LoadMore` advances the page via a GSAP scroll-trigger AND a manual click; both are racy on
    // slower browsers — a single attempt can miss entirely (the button re-renders into a skeleton
    // mid-transition and detaches before the click lands, and the scroll-trigger may not fire). Retry
    // the scroll-into-view + click until the URL actually advances past page 1. It is an infinite-scroll
    // trigger too, so it may auto-advance several pages — assert it moved PAST page 1, not an exact page.
    await expect(async () => {
      await loadMore
        .first()
        .scrollIntoViewIfNeeded()
        .catch(() => undefined);
      await loadMore
        .first()
        .click({ timeout: 2_000 })
        .catch(() => undefined);
      const current = Number(new URL(page.url()).searchParams.get('page') ?? '1');
      expect(current, 'LoadMore should push ?page>=2').toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 20_000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    // The grid must grow beyond the first page once more pages are loaded.
    await expect
      .poll(() => page.locator(REAL_CARDS).count(), { timeout: 20_000 })
      .toBeGreaterThan(initial);
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

  test('unknown category handle renders the not-found view', async ({ page }) => {
    const res = await page.goto('/shop/category/__no_such_category_xyz__', {
      waitUntil: 'domcontentloaded',
    });
    // The category route sits under a `loading.tsx` boundary, so Next 16 flushes a 200 shell before
    // `notFound()` resolves — an unknown handle is a soft-404 (200), not a hard 404 (MISMATCH-LOG E.1).
    // Assert the not-found view rendered rather than the HTTP status.
    expect([200, 404]).toContain(res?.status());
    await expect(
      page
        .getByRole('link', { name: /return home/i })
        .filter({ visible: true })
        .first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
