import { expect, type Page, test } from '@playwright/test';

import {
  getTestUserCreds,
  gotoAndReady,
  openFirstProduct,
  signInAsTestUser,
} from './fixtures/helpers';

// The favorites toast surfaces after the (mocked) subscribe settles; react-toastify auto-dismisses,
// so give the optional assertion a generous but bounded budget.
const TOAST_SETTLE_MS = 10_000;

/**
 * signInOrSkip — wraps signInAsTestUser so the whole test is skipped (not failed) when OneEntry
 * rejects the configured creds (e.g. a server-side password rotation).
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
 * waitForAuthReady — waits until the client has hydrated the authenticated session.
 *
 * A viewport-agnostic gate: `NavItemProfile` renders the `<Link href="/profile">` only when `isAuth`
 * is true. That link lives in the desktop header (`hidden md:block`), which is `display:none` on
 * mobile but still present in the DOM — so gate on *attachment*, not visibility, to work on every
 * project. Without this the heart click can land on the guest branch (no subscribe request fires).
 *
 * @param   {Page}   page - Playwright page (sign-in already performed).
 * @returns Promise resolving once the authenticated profile link is in the DOM.
 */
const waitForAuthReady = async (page: Page): Promise<void> => {
  await expect(page.locator('header a[href="/profile"]').first()).toBeAttached({ timeout: 15_000 });
};

// Serialized: all tests share the same OneEntry test user, and parallel sign-ins of the same account
// can collide on the server-side session (surfacing a spurious "Authentication failed").
test.describe.serial('Product favorites → event subscriptions (auth, network)', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('authed heart on the product page fires an Events (un)subscribe request', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // Land on a product detail page (`.shop_section`), then make sure auth has hydrated — the
    // subscribe path only runs on the authenticated branch of `FavoritesButton`.
    await openFirstProduct(page);
    await waitForAuthReady(page);

    // Stub the event mutations so live e2e never writes real subscriptions to OneEntry. The heart's
    // state is unknown (the authed user's synced wishlist may already contain this product), so the
    // click can fire either `subscribeByMarker` (POST `/subscribe/marker/<marker>`) or
    // `unsubscribeByMarker` (POST `/unsubscribe/marker/<marker>`) — the same route covers both.
    // Errors inside `onSubscribeEvents` are swallowed, so a bare success body is enough.
    await page.route(/\/(un)?subscribe\/marker\//, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: 'true' })
    );

    // The cover heart (`ProductCover` → `FavoritesButton`) is the first favourites button inside the
    // product section; its aria-label is "Add to favorites" or "Remove from favorites" depending on
    // current state, so match on the shared "favorites" substring.
    const heart = page.locator('.shop_section button[aria-label*="favorites" i]').first();
    await expect(heart).toBeVisible({ timeout: 15_000 });

    // Arm the request listener *before* the click. `waitForRequest` observes the request regardless of
    // the mock route, so it captures whichever of subscribe/unsubscribe the toggle triggers.
    const subscribeRequest = page.waitForRequest(
      req => /\/(un)?subscribe\/marker\//.test(req.url()),
      { timeout: 15_000 }
    );

    await heart.click();

    const req = await subscribeRequest;
    // `/unsubscribe/marker/` contains `subscribe/marker/` as a substring, so this matches either verb.
    expect(req.url()).toMatch(/subscribe\/marker\//);

    // Optional: the favorites toast typically appears once the subscribe settles. Best-effort — the
    // network assertion above is the contract; don't fail the run if the toast already auto-dismissed.
    const toastSeen = await page
      .getByText(/favorites/i)
      .first()
      .waitFor({ state: 'visible', timeout: TOAST_SETTLE_MS })
      .then(() => true)
      .catch(() => false);
    if (!toastSeen) {
      test.info().annotations.push({
        type: 'note',
        description: 'favorites toast not observed (auto-dismissed / timing) — network assertion holds',
      });
    }
  });
});
