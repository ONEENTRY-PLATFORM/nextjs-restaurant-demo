import { expect, type Page, test } from '@playwright/test';

import { gotoAndReady, isMobile } from './fixtures/helpers';

/**
 * openFavoritesPopup — clicks the Favorites trigger (desktop header on md+, bottom-menu on mobile)
 * and waits for the `FavoritesPopup` overlay to mount.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the popup body is visible.
 */
const openFavoritesPopup = async (page: Page): Promise<void> => {
  const desktopTrigger = page.locator('header button[aria-label="Favorites"]').first();
  // The Favorites button is rendered twice (desktop header + mobile bottom menu); the hidden copy
  // comes first in the DOM, so filter to the visible one before clicking.
  const anyTrigger = page
    .locator('button[aria-label="Favorites"]')
    .filter({ visible: true })
    .first();

  if (!isMobile(page) && (await desktopTrigger.isVisible().catch(() => false))) {
    await desktopTrigger.click();
  } else {
    await anyTrigger.click();
  }

  await expect(page.locator('#modalBody')).toBeVisible({ timeout: 10_000 });
  // FavoritesPopup renders the title twice (mobile header + desktop) — Playwright treats opacity-0
  // / display:none-via-md: as "visible" if size is non-zero, so explicitly filter to the visible one.
  await expect(
    page
      .locator('#modalBody')
      .getByText(/^Favorites$/)
      .filter({ visible: true })
      .first()
  ).toBeVisible();
};

test.describe('Favorites flow', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    // One-time clear: navigate to the origin once and wipe storage. Using `addInitScript` instead
    // re-clears on EVERY navigation inside the test, which wipes redux-persist state between
    // navigations (e.g., /shop → /profile/favorites) and makes mid-test favorites tests fail.
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

  test('empty Favorites popup shows empty state and a Go to shop link', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openFavoritesPopup(page);

    const popup = page.locator('#modalBody');
    await expect(popup.getByText(/you have no favorites yet/i).first()).toBeVisible();
    await expect(popup.getByRole('link', { name: /go to shop/i })).toBeVisible();
    await expect(popup.locator('.favorite-card')).toHaveCount(0);
  });

  test('adding a product from home → it appears in the Favorites popup', async ({ page }) => {
    await gotoAndReady(page, '/');

    let card = page.locator('.menu_item').first();
    if (!(await card.isVisible({ timeout: 15_000 }).catch(() => false))) {
      test.info().annotations.push({
        type: 'fallback',
        description: 'home recommended block empty — falling back to /shop',
      });
      await gotoAndReady(page, '/shop');
      card = page.locator('.menu_item').first();
    }
    await expect(card).toBeVisible({ timeout: 20_000 });

    const title = (await card.locator('.menu_item-title').innerText()).trim();
    expect(title.length).toBeGreaterThan(0);

    const heart = card.locator('button[aria-label="Add to favorites"]');
    await expect(heart).toBeVisible();
    await expect(heart).toHaveAttribute('aria-pressed', 'false');

    await heart.click();

    // After the click `aria-label` flips to "Remove from favorites" — the original `heart` locator
    // no longer matches. Assert the post-click state via the new selector.
    const removeHeart = card.locator('button[aria-label="Remove from favorites"]');
    await expect(removeHeart).toBeVisible();
    await expect(removeHeart).toHaveAttribute('aria-pressed', 'true');

    await openFavoritesPopup(page);

    const popup = page.locator('#modalBody');
    await expect(popup.getByText(/you have no favorites yet/i).first()).toBeHidden();

    const favCards = popup.locator('.favorite-card');
    await expect(favCards.first()).toBeVisible({ timeout: 15_000 });
    await expect(favCards).toHaveCount(1);

    await expect(favCards.first().getByText(title, { exact: false })).toBeVisible();
  });

  test('badge on the Favorites button shows the favorites count', async ({ page }) => {
    await gotoAndReady(page, '/shop');

    const trigger = isMobile(page)
      ? page.locator('button[aria-label="Favorites"]').filter({ visible: true }).first()
      : page.locator('header button[aria-label="Favorites"]').first();
    await expect(trigger).toBeVisible();

    expect(await trigger.locator('div >> p').count()).toBe(0);

    const cards = page.locator('.menu_item');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });

    const cardCount = Math.min(2, await cards.count());
    for (let i = 0; i < cardCount; i++) {
      await cards.nth(i).locator('button[aria-label="Add to favorites"]').click();
    }

    const badge = trigger.locator('div p').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(String(cardCount));
  });

  test('added product shows up on /profile/favorites', async ({ page }) => {
    await gotoAndReady(page, '/shop');

    const card = page.locator('.menu_item').first();
    await expect(card).toBeVisible({ timeout: 20_000 });
    const title = (await card.locator('.menu_item-title').innerText()).trim();

    await card.locator('button[aria-label="Add to favorites"]').click();
    await expect(card.locator('button[aria-label="Remove from favorites"]')).toBeVisible();

    await gotoAndReady(page, '/profile/favorites');

    await expect(page.getByText(/you have no favorites yet/i)).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('button[aria-label="Remove from favorites"]').first()).toBeVisible();
  });

  test('clicking the heart again removes the product → popup is empty again', async ({ page }) => {
    await gotoAndReady(page, '/shop');

    const card = page.locator('.menu_item').first();
    await expect(card).toBeVisible({ timeout: 20_000 });

    await card.locator('button[aria-label="Add to favorites"]').click();
    const removeHeart = card.locator('button[aria-label="Remove from favorites"]');
    await expect(removeHeart).toBeVisible();

    await removeHeart.click();
    await expect(card.locator('button[aria-label="Add to favorites"]')).toBeVisible();

    await openFavoritesPopup(page);
    await expect(
      page
        .locator('#modalBody')
        .getByText(/you have no favorites yet/i)
        .first()
    ).toBeVisible();
    await expect(page.locator('.favorite-card')).toHaveCount(0);
  });
});
