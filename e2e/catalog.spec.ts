import { expect, test } from '@playwright/test';

import { firstProductCard, gotoAndReady } from './fixtures/helpers';

test.describe('Catalog & product page', () => {
  test('/shop catalog renders product cards', async ({ page }) => {
    await gotoAndReady(page, '/shop');

    const grid = page.locator('.menu_items');
    await expect(grid).toBeVisible({ timeout: 20_000 });

    const cards = grid.locator('.menu_item');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('card has title, price, cooking time, weight, rating and an add button', async ({
    page,
  }) => {
    await gotoAndReady(page, '/shop');
    const card = firstProductCard(page);
    await expect(card).toBeVisible();

    await expect(card.locator('.menu_item-title')).toBeVisible();
    await expect(card.locator('.menu_item-title')).not.toBeEmpty();

    const descr = card.locator('.descr');
    await expect(descr).toBeVisible();

    // Cooking time — `<p> {n} min</p>` inside `.descr`.
    await expect(descr.locator('p', { hasText: /\d+\s*min\b/ })).toBeVisible();

    // Weight — `<p>{n} g</p>` inside `.descr`.
    await expect(descr.locator('p', { hasText: /\d+\s*g\b/ })).toBeVisible();

    // Rating — `.rating p` always renders (defaults to '5'), text must be numeric.
    const rating = descr.locator('.rating p');
    await expect(rating).toBeVisible();
    await expect(rating).toHaveText(/^\d+(\.\d+)?$/);

    const addBtn = card.locator('button[aria-label*="to cart"]');
    await expect(addBtn).toBeVisible();
  });

  test('clicking a card opens the product page', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    const card = firstProductCard(page);
    await expect(card).toBeVisible();

    const link = card.locator('a[href^="/shop/product/"]').first();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/shop\/product\/\d+$/);

    await link.click();
    await page.waitForURL(/\/shop\/product\/\d+/);

    await expect(page.locator('.shop_section')).toBeVisible();

    // The accessible name is templated as `Add <title> to cart`, so match on the stable suffix.
    const addToCart = page.getByRole('button', { name: /to cart|out of stock/i }).first();
    await expect(addToCart).toBeVisible();
  });

  test('nonexistent product page -> 404', async ({ page }) => {
    const response = await page.goto('/shop/product/999999999', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(404);
  });
});
