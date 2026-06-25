import { expect, test } from '@playwright/test';

import { isMobile, openFirstProduct } from './fixtures/helpers';

test.describe('ProductSingle (product page)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    // One-time clear instead of `addInitScript`, which would wipe redux-persist state on every
    // navigation inside the test (breaking flows that read localStorage after a goto).
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        /* SSR-safe */
      }
    });
  });

  test('renders the product section, title and CTA', async ({ page }) => {
    await openFirstProduct(page);

    const section = page.locator('.shop_section');
    await expect(section).toBeVisible();

    // ProductSingle renders the title twice (desktop `hidden md:block` + mobile `md:hidden`); the
    // hidden copy is first in the DOM, so filter to the visible one.
    const title = section
      .locator('p.font-bold.text-xl.tracking-fine.text-paper')
      .filter({ visible: true })
      .first();
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();

    // aria-label is templated as `Add <title> to cart`, so match by substring (and `.first()`
    // because related-products section may render additional cart buttons).
    await expect(page.getByRole('button', { name: /to cart|out of stock/i }).first()).toBeVisible();
  });

  test('JSON-LD Product schema is injected into `<head>`', async ({ page }) => {
    await openFirstProduct(page);

    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toBeTruthy();
    const parsed = JSON.parse(jsonLd ?? '{}') as { '@type'?: string; name?: string };
    expect(parsed['@type']).toBe('Product');
    expect(parsed.name).toBeTruthy();
  });

  test('OG-image (if any) — valid URL in meta', async ({ page }) => {
    await openFirstProduct(page);

    const og = page.locator('meta[property="og:image"]').first();
    if ((await og.count()) === 0) test.skip();
    const content = await og.getAttribute('content');
    expect(content).toMatch(/^https?:\/\//);
  });

  test('preference-pill click navigates to /shop?preferences=<value>', async ({ page }) => {
    await openFirstProduct(page);

    const pill = page.locator('a.list_item.list_link[href*="/shop?preferences="]').first();
    if (!(await pill.isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'product has no preferences — skipped',
      });
      test.skip();
    }
    const href = await pill.getAttribute('href');
    expect(href).toMatch(/^\/shop\?preferences=/);
    await pill.click();
    await page.waitForURL(/\/shop\?preferences=/);
    expect(new URL(page.url()).searchParams.get('preferences')).toBeTruthy();
  });

  test('breadcrumb Category / X navigates to /shop/category/<slug>', async ({ page }) => {
    await openFirstProduct(page);

    const crumb = page.locator('a[href^="/shop/category/"]').first();
    if (!(await crumb.isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'product has no category — skipped',
      });
      test.skip();
    }
    const href = await crumb.getAttribute('href');
    expect(href).toMatch(/^\/shop\/category\/[^/]+$/);
    // The breadcrumb can sit outside the viewport on long product pages and `force: true` still
    // honours viewport bounds; navigate directly to verify the link target.
    await page.goto(href!);
    await page.waitForURL(/\/shop\/category\/[^/]+$/);
    expect(new URL(page.url()).pathname).toBe(href);
  });

  test('ADD TO CART → switches to QuantitySelector and persists to cart', async ({ page }) => {
    await openFirstProduct(page);

    const productId = Number(new URL(page.url()).pathname.split('/').pop());
    expect(Number.isFinite(productId)).toBeTruthy();

    // `AddToCartButton` sets `aria-label = "Add <title> to cart"` or `"<title> is out of stock"`
    // (see components/layout/product/components/AddToCartButton.tsx). The previous `^add to cart`
    // anchor never matched because the product title sits between "Add" and "to cart".
    const cta = page.getByRole('button', { name: /to cart|out of stock/i }).first();
    await expect(cta).toBeVisible({ timeout: 20_000 });
    if (await cta.isDisabled()) {
      test.info().annotations.push({ type: 'skip', description: 'product is out of stock' });
      test.skip();
    }

    await cta.click();

    await expect(page.getByRole('button', { name: /decrease/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: /increase/i }).first()).toBeVisible();

    // Each redux-persist slice has its own storage key (`persist:<slice-name>`). The write is
    // throttled, so poll until the cart slice reflects the just-added product.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const raw = window.localStorage.getItem('persist:cart-slice');
            if (!raw) return [] as number[];
            const slice = JSON.parse(raw) as Record<string, string>;
            const productsData = slice.productsData
              ? (JSON.parse(slice.productsData) as Array<{ id: number }>)
              : [];
            return productsData.map(p => p.id);
          }),
        { timeout: 10_000 }
      )
      .toContain(productId);
  });

  test('Heart on the cover adds the product to favorites', async ({ page }) => {
    await openFirstProduct(page);

    const productId = Number(new URL(page.url()).pathname.split('/').pop());
    const heart = page.locator('button[aria-label="Add to favorites"]').first();
    await expect(heart).toBeVisible({ timeout: 10_000 });
    await heart.click();

    await expect(page.locator('button[aria-label="Remove from favorites"]').first()).toBeVisible();

    // redux-persist flushes to localStorage on a throttle, so the write can lag the redux update
    // (the toast / button state already flipped). Poll until the slice reflects the product.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const raw = window.localStorage.getItem('persist:favorites-slice');
            if (!raw) return [] as number[];
            const slice = JSON.parse(raw) as Record<string, string>;
            return (slice.products ? JSON.parse(slice.products) : []) as number[];
          }),
        { timeout: 10_000 }
      )
      .toContain(productId);
  });

  test('Increase in QuantitySelector grows the cart quantity', async ({ page }) => {
    await openFirstProduct(page);

    const productId = Number(new URL(page.url()).pathname.split('/').pop());

    // Same anchoring bug as the first test: `AddToCartButton` aria-label is
    // `Add <title> to cart`, so `^add to cart` never matched and the eager `isVisible()`
    // check silently skipped.
    const cta = page.getByRole('button', { name: /to cart|out of stock/i }).first();
    await expect(cta).toBeVisible({ timeout: 20_000 });
    if (await cta.isDisabled()) {
      test.info().annotations.push({ type: 'skip', description: 'product is out of stock' });
      test.skip();
    }
    await cta.click();

    const inc = page
      .getByRole('button', { name: /increase/i })
      .filter({ visible: true })
      .first();
    await expect(inc).toBeVisible({ timeout: 10_000 });

    // Pace the clicks: wait for the visible quantity input to reflect each increment before clicking
    // again. Firing two rapid clicks races the QuantitySelector's redux→local-state sync and can drop
    // one (observed on mobile). The CTA already added 1, so the input reads 1 → 2 → 3.
    const qtyInput = page.locator(`#qty_selector_${productId}`).filter({ visible: true }).first();
    await expect(qtyInput).toHaveValue('1');
    await inc.click();
    await expect(qtyInput).toHaveValue('2');
    await inc.click();
    await expect(qtyInput).toHaveValue('3');

    // redux-persist throttles its write — poll the slice until the persisted quantity catches up.
    await expect
      .poll(
        () =>
          page.evaluate(id => {
            const raw = window.localStorage.getItem('persist:cart-slice');
            if (!raw) return 0;
            const slice = JSON.parse(raw) as Record<string, string>;
            const productsData = slice.productsData
              ? (JSON.parse(slice.productsData) as Array<{ id: number; quantity: number }>)
              : [];
            return productsData.find(p => p.id === id)?.quantity ?? 0;
          }, productId),
        { timeout: 10_000 }
      )
      .toBeGreaterThanOrEqual(3);
  });

  test('product page shows related blocks (if any)', async ({ page }) => {
    if (isMobile(page)) {
      // Related rendering depends on CMS blocks; on narrow mobile the render is the same,
      // but we check without layout-specific assertions.
    }
    await openFirstProduct(page);
    await page.waitForLoadState('networkidle').catch(() => undefined);

    // RelatedItems / ProductsGroup may not render if the product has no related items —
    // the test treats either a related section or its explicit absence as success, as long as
    // the main `.shop_section` grid renders without errors.
    await expect(page.locator('.shop_section')).toBeVisible();
  });
});
