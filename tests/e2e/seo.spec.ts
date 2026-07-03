import { expect, test } from '@playwright/test';

import { gotoAndReady } from './fixtures/helpers';

// SEO infrastructure smoke tests. These assert the crawler-facing surface that `app/robots.ts`,
// `app/sitemap.ts` and `app/utils/shopCrawlMeta.ts` produce — not visual output. All checks are
// anonymous (no auth): robots.txt / sitemap.xml are fetched over `page.request`, page-level `robots`
// meta and HTTP status are read via a normal navigation.
test.describe('SEO infrastructure', () => {
  test('robots.txt exposes the Disallow list and the sitemap link', async ({ page }) => {
    const resp = await page.request.get('/robots.txt');
    expect(resp.status()).toBe(200);

    const body = await resp.text();
    // `app/robots.ts` disallows the private/non-indexable areas plus the faceted `/shop` variants.
    expect(body).toMatch(/Disallow/i);
    expect(body).toContain('/profile');
    expect(body).toContain('/cart');
    // Faceted/paginated catalog blocking — the `?`-carrying `/shop` rules from robots.ts.
    expect(body).toContain('/shop?');
    // The ruleset points bots at the sitemap.
    expect(body).toMatch(/Sitemap:\s*\S+\/sitemap\.xml/i);
  });

  test('sitemap.xml lists canonical catalog URLs', async ({ page }) => {
    const resp = await page.request.get('/sitemap.xml');
    expect(resp.status()).toBe(200);

    const body = await resp.text();
    expect(body).toContain('<urlset');
    // `app/sitemap.ts` appends CMS category pages (`/shop/category/<handle>`) and product pages
    // (`/shop/product/<id>`) to the static routes — at least one of them must be present.
    expect(body).toMatch(/\/shop\/(product|category)\//);
  });

  test('faceted /shop is marked noindex', async ({ page }) => {
    // `minPrice` is one of `shopCrawlMeta`'s NON_CANONICAL_PARAMS, so `?minPrice=1` flips the view to
    // a filtered (non-canonical) one → `robots: { index: false }` → `<meta name="robots" content="noindex, follow">`.
    await gotoAndReady(page, '/shop?minPrice=1');

    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveCount(1);
    const content = await robotsMeta.getAttribute('content');
    expect(content).toMatch(/noindex/i);
  });

  test('the bare /shop listing stays indexable', async ({ page }) => {
    // With no faceting params `shopCrawlMeta` returns `index: true`; Next renders
    // `<meta name="robots" content="index, follow">`. The meta may also legitimately be absent, so the
    // assertion is soft: whatever robots meta exists must NOT carry `noindex`.
    await gotoAndReady(page, '/shop');

    const robotsMeta = page.locator('meta[name="robots"]');
    if ((await robotsMeta.count()) > 0) {
      const content = await robotsMeta.first().getAttribute('content');
      expect(content ?? '').not.toMatch(/noindex/i);
    }
  });

  test('unknown restaurant handle is a hard 404', async ({ page }) => {
    // `app/restaurants/[handle]` is `force-static` + `dynamicParams = false`, so a handle outside
    // `generateStaticParams` resolves to a real framework HTTP 404 before the route renders.
    const resp = await page.goto('/restaurants/definitely-not-a-real-restaurant-xyz', {
      waitUntil: 'domcontentloaded',
    });
    expect(resp?.status()).toBe(404);
  });

  test('unknown product id is a soft-404 (200 + not-found view)', async ({ page }) => {
    // The product route flushes a 200 loading-skeleton shell before `getProductById` resolves and
    // `notFound()` fires (see MISMATCH-LOG E.1), so an unknown id is a soft-404 (200), not a hard 404.
    // Assert the not-found view rendered rather than a 404 status.
    const resp = await page.goto('/shop/product/999999999', {
      waitUntil: 'domcontentloaded',
    });
    expect(resp?.status()).toBe(200);

    const returnHome = page
      .getByRole('link', { name: /return home/i })
      .filter({ visible: true })
      .first();
    await expect(returnHome).toBeVisible({ timeout: 15_000 });
  });
});
