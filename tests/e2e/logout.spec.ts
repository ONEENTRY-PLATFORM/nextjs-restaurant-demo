import { expect, type Page, test } from '@playwright/test';

import {
  getTestUserCreds,
  gotoAndReady,
  isMobile,
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
 * logoutViaMenu — opens the profile menu and clicks its Logout control.
 *
 * Desktop: hover the header Profile link (`a[href="/profile"]`) to reveal the `ul[role="menu"]`
 * dropdown (`NavItemProfile`) and click its `LogoutMenuItem` button. Mobile: open the slide-up
 * `ProfilePopup` from the bottom-menu profile button and click the Logout row inside its
 * `Profile menu` nav (`ProfileNavMenu`).
 *
 * @param   {Page}   page - Playwright page (must already be signed in).
 * @returns Promise resolving once the Logout control has been clicked.
 */
const logoutViaMenu = async (page: Page): Promise<void> => {
  if (isMobile(page)) {
    // The profile button is rendered in the bottom menu; its accessible name comes from the CMS
    // menu title ("Profile"). The hidden desktop copy also matches, so filter to the visible one.
    await page
      .getByRole('button', { name: /profile/i })
      .filter({ visible: true })
      .first()
      .click();

    const popup = page.locator('#modalBody');
    await expect(popup).toBeVisible({ timeout: 15_000 });

    const logout = popup.getByRole('button', { name: /log ?out/i }).first();
    await expect(logout).toBeVisible({ timeout: 10_000 });
    // The ProfilePopup rows keep re-animating (GSAP `profile-anim-row`), so a normal click races the
    // stability check ("not stable" → "detached"). Dispatch the click directly — it fires the React
    // onClick without waiting for actionability.
    await logout.scrollIntoViewIfNeeded().catch(() => undefined);
    await logout.dispatchEvent('click');
    return;
  }

  const profileLink = page
    .locator('header')
    .getByRole('link', { name: /profile/i })
    .filter({ visible: true })
    .first();
  await expect(profileLink).toBeVisible({ timeout: 15_000 });

  // Hover reveals the `<ul role="menu">` dropdown sourced from the `user_menu` profile children.
  await profileLink.hover();

  const menu = page.locator('header').getByRole('menu');
  await expect(menu).toBeVisible({ timeout: 10_000 });

  const logout = menu.getByRole('button', { name: /log ?out/i }).first();
  await expect(logout).toBeVisible({ timeout: 10_000 });
  await logout.click();
};

// Serialized: all tests share the same OneEntry test user, and parallel sign-ins of the same
// account can collide on the server-side session.
test.describe.serial('Logout flow', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('logging out returns the user to the guest state', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // Wait until auth is ready before opening the profile menu — otherwise the profile trigger takes
    // the guest path (auth picker) instead of the ProfilePopup/menu. `waitForAuthedHeader` gates on the
    // authed Profile link being in the DOM, which works on both desktop and mobile.
    await waitForAuthedHeader(page);

    await logoutViaMenu(page);

    // Logout invalidates the session server-side and re-runs the auth check (`logOutUser` does not
    // clear the local token itself — the next getMe 401 drops the session). Navigating to the guarded
    // /profile route forces a fresh check, so it is the definitive signal of the guest state.
    await page.waitForTimeout(1500);
    await gotoAndReady(page, '/profile');
    await expect(page.getByText(/please sign in to view your profile/i)).toBeVisible({
      timeout: 25_000,
    });
    // The header no longer offers the authed Profile link.
    await expect(page.locator('header a[href="/profile"]')).toHaveCount(0, { timeout: 15_000 });
  });
});
