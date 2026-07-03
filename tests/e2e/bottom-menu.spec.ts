import { expect, type Locator, type Page, test } from '@playwright/test';

import { gotoAndReady, isMobile } from './fixtures/helpers';

/**
 * bottomMenu — locator for the mobile bottom-navigation root (fixed bar, `md:hidden`, `z-600`).
 *
 * All nav clicks are scoped here so they never hit the (mobile-hidden) desktop header copies of the
 * same buttons that also live in the DOM.
 *
 * @param   {Page} page - Playwright page.
 * @returns Locator scoped to the fixed bottom-menu container.
 */
const bottomMenu = (page: Page): Locator => page.locator('div.fixed.bottom-0.z-600').first();

/**
 * categoryDrawerOnScreen — reports whether the `CategoryFilter` `aside` (the one whose text contains
 * "Category") currently sits inside the viewport.
 *
 * The drawer stays mounted in the DOM and only slides in/out via CSS transforms, so `toBeVisible`
 * alone can't tell open from closed — bounding-box geometry is the reliable signal.
 *
 * @param   {Page} page - Playwright page.
 * @returns Promise resolving to `true` when the Category drawer is within the viewport.
 */
const categoryDrawerOnScreen = async (page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
    const list = document.querySelectorAll('aside');
    for (const el of Array.from(list)) {
      if (!el.textContent?.includes('Category')) continue;
      const r = (el as HTMLElement).getBoundingClientRect();
      if (
        r.left < window.innerWidth &&
        r.right > 0 &&
        r.top < window.innerHeight &&
        r.bottom > 0 &&
        r.width > 0 &&
        r.height > 0
      ) {
        return true;
      }
    }
    return false;
  });
};

test.describe('Mobile bottom menu', () => {
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

  test('catalog nav-item opens the CategoryFilter drawer', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile bottom menu only');

    await gotoAndReady(page, '/');

    // NavItemCatalog carries no aria-label and no stable text (icon-only). Within the bottom menu it is
    // the only <button> with the `flex-col` class: Home/Calendar are <a>, Favorites/Cart/Close are
    // <button> but each has an aria-label, and Profile is a <button> without `flex-col`.
    const catalog = bottomMenu(page)
      .locator('button.flex-col')
      .filter({ visible: true })
      .first();
    await expect(catalog).toBeVisible();
    await catalog.click();

    const drawer = page.locator('aside').filter({ hasText: 'Category' }).first();
    await expect(drawer).toBeVisible();
    // The drawer only counts as "open" once it has slid into the viewport (500ms transform).
    await expect.poll(() => categoryDrawerOnScreen(page), { timeout: 3_000 }).toBeTruthy();
    await expect(drawer.getByText('Category', { exact: true })).toBeVisible();
  });

  test('favorites nav-item opens the FavoritesPopup', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile bottom menu only');

    await gotoAndReady(page, '/');

    const favorites = bottomMenu(page)
      .locator('button[aria-label="Favorites"]')
      .filter({ visible: true })
      .first();
    await expect(favorites).toBeVisible();
    await favorites.click();

    const popup = page.locator('#modalBody');
    await expect(popup).toBeVisible({ timeout: 10_000 });
    // FavoritesPopup renders the title twice (mobile + desktop headers) — pick the visible copy.
    await expect(
      popup
        .getByText(/^Favorites$/)
        .filter({ visible: true })
        .first()
    ).toBeVisible();
  });

  test('profile nav-item (guest) opens the auth provider picker', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile bottom menu only');

    // Storage cleared in beforeEach → guest session, so profile routes to the auth-provider picker.
    await gotoAndReady(page, '/');

    // NavItemProfile is the only bottom-menu <button> with neither an aria-label (Favorites/Cart/Close
    // have one) nor the `flex-col` class (that's NavItemCatalog).
    const profile = bottomMenu(page)
      .locator('button:not([aria-label]):not(.flex-col)')
      .filter({ visible: true })
      .first();
    await expect(profile).toBeVisible();
    await profile.click();

    const popup = page.locator('#modalBody');
    await expect(popup).toBeVisible({ timeout: 10_000 });
    // AuthProviderSelect renders provider buttons ("Login With Email" / "Login With Google" / …) once
    // the providers query resolves.
    await expect(popup.getByText(/email|google|phone/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
