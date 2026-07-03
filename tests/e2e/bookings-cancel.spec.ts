import { expect, type Locator, type Page, test } from '@playwright/test';

import { getTestUserCreds, gotoAndReady, signInAsTestUser } from './fixtures/helpers';

// The reservation popup's fields mount inside the GSAP-staggered `FormFieldAnimations` wrapper, so
// eager visibility checks race the fade timeline — give the `#name` field a generous settle budget.
const FORM_SETTLE_MS = 15_000;

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
 * openBookings — navigates the signed-in user to `/profile/bookings` and waits for the auth-gated
 * dashboard to settle (a booking row `№<number>` or the "no active reservations" empty state).
 *
 * @param   {Page}   page - Playwright page (must already be signed in).
 * @returns Promise resolving once the bookings dashboard has rendered.
 */
const openBookings = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/profile/bookings');
  // BookingsContent renders `№<orderNumber>` rows plus the "no active reservations" empty state —
  // wait for either so the assertion doesn't race the client-side order fetch.
  const anyRow = page.locator('text=/^№\\s*\\d+/').first();
  const empty = page.getByText(/no active reservations/i);
  await expect(anyRow.or(empty).first()).toBeVisible({ timeout: 20_000 });
};

/**
 * firstActiveActionButton — returns the first active-booking action button (Cancel / Edit), or null
 * when the E2E user has no active reservation. Only `ActiveBookingCard` renders these buttons
 * (`HistoryBookingCard` is read-only), so a match implies an active booking is present.
 *
 * @param   {Page}   page  - Playwright page (on `/profile/bookings`).
 * @param   {RegExp} label - Accessible-name matcher for the action button (`/cancel/i` or `/edit/i`).
 * @returns Promise resolving to the button Locator, or null when no active booking is present.
 */
const firstActiveActionButton = async (page: Page, label: RegExp): Promise<Locator | null> => {
  const btn = page.getByRole('button', { name: label }).first();
  const present = await btn
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  return present ? btn : null;
};

// Serialized: all tests share the same OneEntry test user, and parallel sign-ins of the same account
// can collide on the server-side session (surfacing a spurious "Authentication failed").
test.describe.serial('Bookings — cancel / edit (auth, data-dependent)', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('cancel: confirm → PUT status booking_cancelled → cancelled toast/label, stays on /profile/bookings', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openBookings(page);

    // Data-dependent: needs an active booking exposing a Cancel button. Skip (don't fail) otherwise —
    // seeding an active reservation is admin/data work.
    const cancelBtn = await firstActiveActionButton(page, /cancel/i);
    if (!cancelBtn) {
      test.skip(true, 'E2E user has no active booking with a Cancel action — seed an active booking');
    }

    // Accept the `window.confirm("Cancel reservation #<id>?")` dialog — must be armed before the click.
    page.on('dialog', d => d.accept());

    // Intercept the cancel mutation so live e2e never writes to OneEntry. `onCancel` calls
    // `Orders.updateOrderByMarkerAndId` = PUT `/marker/<marker>/orders/<id>`; only the PUT is stubbed
    // (the GET/list variants on the same URL pass through). The UI updates from local Redux state, so
    // a static success body is enough to clear the `isError` guard.
    await page.route(/\/marker\/[^/]+\/orders\/\d+(\?|$)/, async route => {
      if (route.request().method() !== 'PUT') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 999999, statusIdentifier: 'booking_cancelled' }),
      });
    });

    await cancelBtn!.click();

    // Success surfaces two signals: the "Reservation cancelled." toast and the card status turning
    // "Cancelled" (the order also moves into the History section). Assert either.
    const toastMsg = page.getByText(/reservation cancelled/i);
    const statusMsg = page.locator('.profile-anim-row').getByText(/^cancelled$/i);
    await expect(toastMsg.or(statusMsg).first()).toBeVisible({ timeout: FORM_SETTLE_MS });

    // No navigation away from the bookings dashboard.
    expect(new URL(page.url()).pathname).toBe('/profile/bookings');
  });

  test('edit: opens the reservation popup with the booking form', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openBookings(page);

    // Data-dependent: needs an active booking exposing an Edit button. Skip otherwise.
    const editBtn = await firstActiveActionButton(page, /edit/i);
    if (!editBtn) {
      test.skip(true, 'E2E user has no active booking with an Edit action — seed an active booking');
    }

    // `onEdit` stashes the pending edit and opens `ReservationPopup` (`#modalBody`) with the booking
    // form pre-filled — the `#name` field mounts inside the animated wrapper.
    await editBtn!.click();

    const modal = page.locator('#modalBody').first();
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal.locator('#name')).toBeVisible({ timeout: FORM_SETTLE_MS });

    // Don't submit (would mutate the booking) — close the popup.
    await page.keyboard.press('Escape');
  });
});
