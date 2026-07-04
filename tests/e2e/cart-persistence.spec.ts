import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import {
  addFirstProductToCart,
  getTestUserCreds,
  gotoAndReady,
  openCartFromHeader,
  signInAsTestUser,
  waitForAuthedHeader,
} from './fixtures/helpers';

/**
 * signInOrSkip — wraps signInAsTestUser so the whole test is skipped (not failed) when the
 * configured creds are rejected by OneEntry. Saves the suite from cascading failures when the
 * password rotates server-side.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once signed in; otherwise the test is marked skipped.
 */
const signInOrSkip = async (page: Page): Promise<void> => {
  try {
    await signInAsTestUser(page);
  } catch (err) {
    test.skip(
      true,
      err instanceof Error ? err.message : 'OneEntry auth failed for the configured E2E user'
    );
  }
};

/**
 * clearGuestStorage — wipes cookies + local/session storage so the cart starts empty.
 *
 * One-time clear (navigate to origin once, then wipe): using `addInitScript` would re-clear on
 * every navigation and destroy the redux-persist cart mid-test.
 *
 * @param   {BrowserContext} context - Playwright browser context.
 * @param   {Page}           page    - Playwright page.
 * @returns Promise resolving once cookies and web storage are cleared.
 */
const clearGuestStorage = async (context: BrowserContext, page: Page): Promise<void> => {
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
};

// A2 — guest cart persists across a full reload (redux-persist in localStorage). No auth involved,
// so this stays a plain (non-serial) describe with its own storage-clearing beforeEach.
test.describe('Cart persistence — guest survives reload', () => {
  test.beforeEach(async ({ context, page }) => {
    await clearGuestStorage(context, page);
  });

  test('A2: adding a product then reloading /cart keeps the item in the cart', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    await addFirstProductToCart(page);

    await openCartFromHeader(page);

    const rows = page.locator('.product-in-cart');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    expect(await rows.count()).toBeGreaterThanOrEqual(1);

    // redux-persist rehydrates the cart from localStorage on mount — the row must survive a reload.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    await expect(page.locator('.product-in-cart').first()).toBeVisible({ timeout: 20_000 });
  });
});

// A1 — a guest cart built before login must merge into the account (local rows are not dropped).
// Serialized: shares the single OneEntry test user, and parallel sign-ins of the same account can
// collide on the server session. Split from the guest describe so the auth-only beforeEach (creds
// skip) never gates the guest-persist test.
test.describe.serial('Cart persistence — guest cart merges on login', () => {
  test.beforeEach(async ({ context, page }) => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
    await clearGuestStorage(context, page);
  });

  test('A1: a product added as a guest is still in the cart after signing in', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    const card = await addFirstProductToCart(page);
    const title = (await card.locator('.menu_item-title').innerText()).trim();
    expect(title.length).toBeGreaterThan(0);

    await signInOrSkip(page);

    await gotoAndReady(page, '/cart');
    await waitForAuthedHeader(page);

    // Soft check: the guest item (matched by its title) must still be present after the merge. The
    // account may also carry server-side rows, so we assert presence of the local title, not an
    // exact row count.
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  });
});
