import { expect, type Locator, type Page, test } from '@playwright/test';

import { addFirstProductToCart, firstProductCard, gotoAndReady, isMobile } from './fixtures/helpers';

/**
 * bottomMenu — locator for the mobile bottom-navigation root (fixed bar, `md:hidden`, `z-600`).
 *
 * Scoping cart/profile clicks to this container keeps them off the (mobile-hidden) desktop header and
 * off the product-card "Add … to cart" buttons that also carry a `cart` aria-label on `/shop`.
 *
 * @param   {Page} page - Playwright page.
 * @returns Locator scoped to the fixed bottom-menu container.
 */
const bottomMenu = (page: Page): Locator => page.locator('div.fixed.bottom-0.z-600').first();

/**
 * openCartPopup — clicks the central Cart button in the mobile bottom menu and waits for the
 * `CartPopup` drawer (`#modalBody`) to mount.
 *
 * The trigger is `CenterCartButton` (`aria-label="Open cart"`); its click dispatches `resetCheckout`,
 * so the drawer always opens on the `cart` step regardless of any prior wizard state.
 *
 * @param   {Page} page - Playwright page.
 * @returns Promise resolving once the cart drawer body is visible.
 */
const openCartPopup = async (page: Page): Promise<void> => {
  const trigger = bottomMenu(page)
    .locator('button[aria-label*="cart" i]')
    .filter({ visible: true })
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator('#modalBody')).toBeVisible({ timeout: 10_000 });
};

test.describe('CartPopup drawer (mobile bottom menu)', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    // One-time clear: navigate to the origin once and wipe storage. `addInitScript` would re-clear on
    // every navigation and wipe redux-persist state mid-test (see favorites.spec.ts).
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

  test('adding a product → CartPopup shows the row and the APPLY button', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile bottom menu only');

    await gotoAndReady(page, '/shop');
    await expect(firstProductCard(page)).toBeVisible({ timeout: 20_000 });

    const card = await addFirstProductToCart(page);
    const title = (await card.locator('.menu_item-title').innerText()).trim();

    // Cart count badge on the trigger reflects the just-added product (rehydrated Redux slice).
    const badge = bottomMenu(page).locator('button[aria-label*="cart" i] p').first();
    await expect(badge).toBeVisible({ timeout: 10_000 });

    await openCartPopup(page);

    const popup = page.locator('#modalBody');
    const rows = popup.locator('.product-in-cart');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(popup.locator('.cart_btn')).toBeVisible();

    if (title.length > 0) {
      await expect(popup.getByText(title, { exact: false }).first()).toBeVisible();
    }
  });

  test('empty cart → CartPopup shows the empty state and a Go to shop link', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile bottom menu only');

    // Storage cleared in beforeEach → the cart is empty on open.
    await gotoAndReady(page, '/');
    await openCartPopup(page);

    const popup = page.locator('#modalBody');
    await expect(popup.getByText(/empty cart/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(popup.getByRole('link', { name: /go to shop/i })).toBeVisible();
    await expect(popup.locator('.product-in-cart')).toHaveCount(0);
  });
});
