import { expect, test } from '@playwright/test';

import { gotoAndReady } from './fixtures/helpers';

/**
 * payment-result.spec.ts — the Stripe return landings `/payment/success` and `/payment/cancel`.
 *
 * These are purely presentational pages (`components/payment/PaymentResult.tsx`). Stripe triggers a
 * full reload, so the order id is read from the URL query (`orderId` / `order_id` / `id`), not Redux.
 * Both pages are `noindex`. No auth or cart state is required — they render standalone.
 */
test.describe('Payment result — success', () => {
  test('renders the order number from ?orderId= and the order/home links', async ({ page }) => {
    await gotoAndReady(page, '/payment/success?orderId=123456');

    // The order number comes straight from the query (not dictionary-driven), so it is a stable anchor.
    await expect(page.getByText(/№\s*123456/)).toBeVisible({ timeout: 15_000 });

    // Primary CTA → orders (the confirmation card's `.cart_btn`, distinct from the header nav links).
    await expect(page.locator('a.cart_btn[href="/profile/orders"]')).toBeVisible();
  });

  test('accepts the order_id / id query aliases', async ({ page }) => {
    await gotoAndReady(page, '/payment/success?order_id=778899');
    await expect(page.getByText('№ 778899')).toBeVisible({ timeout: 15_000 });
  });

  test('without an order id it still confirms (no № line, orders link present)', async ({
    page,
  }) => {
    await gotoAndReady(page, '/payment/success');

    // No id in the URL → the `№ …` paragraph is not rendered.
    await expect(page.getByText(/^№\s/)).toHaveCount(0);
    // The confirmation card + orders CTA still render.
    await expect(page.locator('a[href="/profile/orders"]')).toBeVisible({ timeout: 15_000 });
  });

  test('is marked noindex', async ({ page }) => {
    await gotoAndReady(page, '/payment/success?orderId=1');
    const content = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content')
      .catch(() => null);
    expect(content ?? '').toMatch(/noindex/i);
  });
});

test.describe('Payment result — cancel', () => {
  test('renders the cancel card with a back-to-cart link (and no orders CTA)', async ({ page }) => {
    await gotoAndReady(page, '/payment/cancel');

    // Cancel routes back to the cart, not to the orders list. Scope to the card's `.cart_btn`
    // (the header also carries an `a[href="/cart"]` nav icon).
    await expect(page.locator('a.cart_btn[href="/cart"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('a[href="/profile/orders"]')).toHaveCount(0);
  });

  test('is marked noindex', async ({ page }) => {
    await gotoAndReady(page, '/payment/cancel');
    const content = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content')
      .catch(() => null);
    expect(content ?? '').toMatch(/noindex/i);
  });
});
