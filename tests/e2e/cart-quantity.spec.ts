import { expect, type Page, test } from '@playwright/test';

import { addFirstProductToCart, gotoAndReady } from './fixtures/helpers';

/**
 * addOneAndOpenCart — clears storage, adds the first catalog product, and opens `/cart`.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once a `.product-in-cart` row is visible on `/cart`.
 */
const addOneAndOpenCart = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/shop');
  await addFirstProductToCart(page);
  await gotoAndReady(page, '/cart');
  await expect(page.locator('.product-in-cart').first()).toBeVisible({ timeout: 20_000 });
};

test.describe('Cart page — quantity & removal controls', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
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

  test('Increase / Decrease change the quantity input on the cart row', async ({ page }) => {
    await addOneAndOpenCart(page);

    const row = page.locator('.product-in-cart').first();
    const qty = row.getByRole('textbox', { name: /quantity/i });
    await expect(qty).toHaveValue('1');

    await row.getByRole('button', { name: /increase quantity/i }).click();
    await expect(qty).toHaveValue('2');

    await row.getByRole('button', { name: /decrease quantity/i }).click();
    await expect(qty).toHaveValue('1');
  });

  test('typing a quantity commits on blur', async ({ page }) => {
    await addOneAndOpenCart(page);

    const row = page.locator('.product-in-cart').first();
    const qty = row.getByRole('textbox', { name: /quantity/i });
    await qty.click();
    await qty.fill('4');
    await qty.blur();
    await expect(qty).toHaveValue('4');
  });

  test('Delete shows an undo toast and Undo restores the row', async ({ page }) => {
    await addOneAndOpenCart(page);

    await expect(page.locator('.product-in-cart')).toHaveCount(1);

    // The toast container is lazy-mounted (requestIdleCallback / 1.5s fallback). On WebKit it can
    // mount after the delete click, dropping the toast — wait for it to be attached first.
    await expect(page.locator('.Toastify')).toBeAttached({ timeout: 10_000 });

    await page
      .locator('.product-in-cart')
      .first()
      .getByRole('button', { name: /delete item/i })
      .click();

    // The removal toast carries an Undo action.
    await expect(page.getByText(/removed from cart/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /^undo$/i }).click();

    // Undo re-adds the product → the row is back.
    await expect(page.locator('.product-in-cart')).toHaveCount(1);
  });

  test('deleting the only item empties the cart (no undo)', async ({ page }) => {
    await addOneAndOpenCart(page);

    await page
      .locator('.product-in-cart')
      .first()
      .getByRole('button', { name: /delete item/i })
      .click();

    // Without pressing Undo the row is gone and the empty state renders.
    await expect(page.getByText(/empty cart/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.product-in-cart')).toHaveCount(0);
  });

  test('row selection checkbox toggles', async ({ page }) => {
    await addOneAndOpenCart(page);

    const checkbox = page.locator('input[type="checkbox"][id^="deselectProduct-"]').first();
    await expect(checkbox).toBeVisible();
    const before = await checkbox.isChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: !before });
  });
});
