import { expect, test } from '@playwright/test';

import {
  addFirstProductToCart,
  gotoAndReady,
  openCartFromHeader,
  openFirstProduct,
} from './fixtures/helpers';

test.describe('Cart flow', () => {
  test('empty cart shows the empty state', async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* SSR-safe */
      }
    });

    await openCartFromHeader(page);
    await expect(page.getByText(/empty cart/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: /go to shop/i })).toBeVisible();
  });

  test('adding a product from the card swaps the button into a counter', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    const card = await addFirstProductToCart(page);

    const counter = card.locator('.counter');
    await expect(counter).toContainText(/x\d+/);

    const inc = card.locator('button[aria-label*="Increase"]');
    await expect(inc).toBeVisible();
    await inc.click();
    await expect(counter).toContainText(/x2/);
  });

  test('adding from the product page -> switches to QuantitySelector', async ({ page }) => {
    await openFirstProduct(page);

    // Wait for the CTA button: `AddToCartButton` renders either the active CTA (aria-label
    // `Add <title> to cart`) or the disabled one (`<title> is out of stock`). Eager
    // `isVisible()` was firing before the product page had finished its dev-mode compile
    // and silently skipping the test.
    const cta = page.getByRole('button', { name: /to cart|out of stock/i }).first();
    await expect(cta).toBeVisible({ timeout: 20_000 });

    if (await cta.isDisabled()) {
      test.info().annotations.push({ type: 'skip', description: 'product is out of stock' });
      test.skip();
    }

    await cta.click();

    const dec = page.getByRole('button', { name: /decrease/i }).first();
    await expect(dec).toBeVisible({ timeout: 10_000 });
  });

  test('from a card -> /cart -> product is listed', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    const card = await addFirstProductToCart(page);
    const title = (await card.locator('.menu_item-title').innerText()).trim();

    await openCartFromHeader(page);

    await expect(page.getByText(/empty cart/i)).toBeHidden({ timeout: 10_000 });

    await expect(page.locator('.product-in-cart, .shop_section')).not.toHaveCount(0);
    const titleNode = page.getByText(title, { exact: false }).first();
    await expect(titleNode).toBeVisible({ timeout: 10_000 });
  });

  test('APPLY button for a guest goes to auth (opens the modal)', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    await addFirstProductToCart(page);

    await openCartFromHeader(page);
    const applyBtn = page.locator('.cart-apply-btn');
    await expect(applyBtn).toBeVisible();

    await applyBtn.click();

    const modal = page.locator('#modalBody');
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByRole('button', { name: /email|google|phone/i }).first()).toBeVisible();
  });
});
