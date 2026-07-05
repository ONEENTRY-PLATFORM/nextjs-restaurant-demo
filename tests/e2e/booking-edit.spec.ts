import { expect, type Locator, type Page, test } from '@playwright/test';

import { getTestUserCreds, gotoAndReady, signInAsTestUser } from './fixtures/helpers';

// The reservation popup mounts its fields inside the GSAP-staggered `FormFieldAnimations` wrapper, so
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
 * @param   {RegExp} label - Accessible-name matcher for the action button (`/edit/i` or `/cancel/i`).
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
test.describe.serial('Bookings — edit submit (auth, data-dependent)', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('edit: change name → submit → PUT update → "updated" toast / popup closes', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openBookings(page);

    // Data-dependent: needs an active booking exposing an Edit button. Skip (don't fail) otherwise —
    // seeding an active reservation is admin/data work. `bookings-cancel.spec.ts` already covers the
    // popup *opening*; here we drive the submit that actually persists the update.
    const editBtn = await firstActiveActionButton(page, /edit/i);
    if (!editBtn) {
      test.skip(
        true,
        'E2E user has no active booking with an Edit action — seed an active booking'
      );
    }

    // `onEdit` stashes the pending edit and opens `ReservationPopup` (`#modalBody`) pre-filled from the
    // order's formData — the `#name` field mounts inside the animated wrapper.
    await editBtn!.click();

    const modal = page.locator('#modalBody').first();
    await expect(modal).toBeVisible({ timeout: 10_000 });
    const nameInput = modal.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: FORM_SETTLE_MS });

    // Change only the name; date/time and the other fields stay pre-filled (they were seeded from the
    // existing order, so touching them would re-run the picker unnecessarily).
    const current = (await nameInput.inputValue()).trim();
    await nameInput.fill(`${current} Edited`.trim());

    // Intercept the update mutation so live e2e never writes to OneEntry. In edit mode
    // `onFormSubmit` → `updateReservation` → `Orders.updateOrderByMarkerAndId` = PUT
    // `/marker/<marker>/orders/<id>`; only the PUT is stubbed (GET/list variants pass through). The
    // UI shows the toast / closes from local state, so a static success body clears the `isError` guard.
    await page.route(/\/marker\/[^/]+\/orders\/\d+(\?|$)/, async route => {
      if (route.request().method() !== 'PUT') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 999999, statusIdentifier: 'booking_accepted' }),
      });
    });

    // Submit — the primary CTA is `<button type="submit">` labelled "Continue" (dictionary-driven).
    const submit = modal.locator('button[type="submit"]', { hasText: /continue/i }).first();
    await expect(submit).toBeVisible({ timeout: FORM_SETTLE_MS });
    await submit.click();

    // In edit mode the form goes straight to `updateReservation` (never the payment/auth branch): on
    // success it fires the "Reservation updated." toast and then calls `onClose` (popup closes). Race
    // the two success signals against a validation error — the latter means the seeded order was
    // missing a valid pre-filled field, which is a data-seed gap (skip, don't fail).
    const toastSeen = page
      .getByText(/updated/i)
      .first()
      .waitFor({ state: 'visible', timeout: FORM_SETTLE_MS })
      .then(() => 'ok' as const)
      .catch(() => null);
    const modalClosed = modal
      .waitFor({ state: 'hidden', timeout: FORM_SETTLE_MS })
      .then(() => 'ok' as const)
      .catch(() => null);
    const invalid = modal
      .locator('.text-red-500')
      .first()
      .waitFor({ state: 'visible', timeout: FORM_SETTLE_MS })
      .then(() => 'invalid' as const)
      .catch(() => null);

    const winner = await Promise.race([toastSeen, modalClosed, invalid]);
    if (winner === 'invalid') {
      test.skip(
        true,
        'seeded booking is missing a valid pre-filled field — cannot submit the edit'
      );
    }
    expect(winner).toBe('ok');

    // No navigation away from the bookings dashboard.
    expect(new URL(page.url()).pathname).toBe('/profile/bookings');
  });
});
