import { expect, type Page, test } from '@playwright/test';

import { getTestUserCreds, gotoAndReady, signInAsTestUser } from './fixtures/helpers';

// Booking fields render inside the staggered `FormFieldAnimations` wrapper (GSAP fade), so eager
// visibility checks race the timeline — give locators a generous settle budget.
const FORM_SETTLE_MS = 15_000;

/**
 * openBookingForm — opens the reservation popup from the first restaurant's detail page. The
 * "Book a table" CTA passes the restaurant handle as the drawer `action`, so the restaurant field
 * is pre-filled and only the remaining fields need input.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the booking form (`#name` field) is visible.
 */
const openBookingForm = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/restaurants');
  const restaurantLink = page.locator('a[href^="/restaurants/"]').filter({ visible: true }).first();
  await expect(restaurantLink).toBeVisible({ timeout: 20_000 });
  const href = await restaurantLink.getAttribute('href');
  await page.goto(href!, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);

  // The CTA label is dictionary-driven (`book_button`): OneEntry currently serves "Book", but the
  // compiled fallback is "Book a table" — match either so the test tracks the CMS label, not a literal.
  const book = page
    .getByRole('button', { name: /^book( a table)?$/i })
    .filter({ visible: true })
    .first();
  await expect(book).toBeVisible({ timeout: 20_000 });
  await book.click();

  await expect(page.locator('#modalBody').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#name')).toBeVisible({ timeout: FORM_SETTLE_MS });
};

/**
 * fillBookingFields — fills the required text/number fields (restaurant is pre-filled).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the fields are filled.
 */
const fillBookingFields = async (page: Page): Promise<void> => {
  await page.locator('#name').fill('Playwright');
  await page.locator('#phone').fill('+15555550123');
  await page.locator('#people_count').fill('2');
};

/**
 * pickTimeSlot — drives the date/time picker: jumps to next month (so every in-month day is in the
 * future), picks the 15th, advances to the time step and applies the first available slot.
 *
 * The picker portals to `<body>` and reuses `id="modalBody"`, so all picker actions are scoped to
 * its own root (the only subtree carrying a "Next month" control) to avoid matching the reservation
 * popup.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the picker has applied and closed.
 */
const pickTimeSlot = async (page: Page): Promise<void> => {
  await page
    .getByRole('button', { name: /time slot/i })
    .first()
    .click();

  // The picker portals to <body> and reuses `id="modalBody"`; it is appended last, so the second
  // `#modalBody` is the picker. Scoping by its body (not by a step-specific control like "Next
  // month", which only exists on the date step) keeps the locator valid across both steps.
  const picker = page.locator('#modalBody').last();
  await expect(picker).toBeVisible({ timeout: 10_000 });

  await picker.getByRole('button', { name: /next month/i }).click();
  await picker
    .locator('button.calend_days:not([data-disabled])', { hasText: /^15$/ })
    .first()
    .click();

  await picker.getByRole('button', { name: /continue/i }).click();
  await picker.locator('button.service_time:not([data-disabled])').first().click();
  await picker.getByRole('button', { name: /apply/i }).click();

  // Picker closed → its calendar is gone (the "Next month" control no longer exists anywhere).
  await expect(page.getByRole('button', { name: /next month/i })).toHaveCount(0);
};

test.describe('Reservation (booking) form', () => {
  test('opens from a restaurant page and renders the booking form', async ({ page }) => {
    await openBookingForm(page);

    const modal = page.locator('#modalBody').first();
    await expect(modal.locator('#name')).toBeVisible();
    await expect(modal.locator('#phone')).toBeVisible();
    await expect(modal.locator('#people_count')).toBeVisible();
    await expect(page.getByRole('button', { name: /time slot/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i }).first()).toBeVisible();
  });

  test('empty required fields keep the user on the form', async ({ page }) => {
    await openBookingForm(page);

    // Submit without filling required fields → JS validation blocks (form is `noValidate`); the
    // form stays mounted and at least one inline error appears.
    await page
      .getByRole('button', { name: /continue/i })
      .first()
      .click();

    await expect(page.getByRole('button', { name: /time slot/i }).first()).toBeVisible();
    await expect(page.locator('#modalBody').first().locator('.text-red-500').first()).toBeVisible({
      timeout: FORM_SETTLE_MS,
    });
  });

  test('filled form (guest) advances to the auth step', async ({ page }) => {
    await openBookingForm(page);
    await fillBookingFields(page);
    await pickTimeSlot(page);

    await page
      .getByRole('button', { name: /continue/i })
      .first()
      .click();

    // Guests must authenticate before payment → the auth-provider step appears.
    await expect(
      page
        .locator('#modalBody')
        .first()
        .getByRole('button', { name: /email|google|sign in|log in/i })
        .first()
    ).toBeVisible({ timeout: FORM_SETTLE_MS });
  });

  test('order placement (authed): payment submit posts a booking order with the booking product', async ({
    page,
  }) => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
    await gotoAndReady(page, '/');
    try {
      await signInAsTestUser(page);
    } catch (err) {
      test.skip(true, err instanceof Error ? err.message : 'OneEntry auth failed for the E2E user');
    }

    // Don't create a real booking or hit the payment provider: intercept the order POST (to assert
    // the payload) and abort the payment session (prevents a real Stripe redirect away from the page).
    let orderBody: {
      products?: Array<{ productId: number; quantity: number }>;
      formData?: unknown;
    } | null = null;
    await page.route(/\/marker\/booking_order\/orders(\?|$)/, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      orderBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 999999, statusIdentifier: 'reserved' }),
      });
    });
    await page.route(/\/sessions(\?|$)/, route => route.abort());

    await openBookingForm(page);
    await fillBookingFields(page);
    await pickTimeSlot(page);

    await page
      .getByRole('button', { name: /continue/i })
      .first()
      .click();

    // Authenticated → straight to the payment step. It defaults to the online "Credit & Debit Cards"
    // (Stripe) method, whose order hook now returns an error when the payment session yields no
    // checkout URL — and the test aborts `/sessions`, so that path can never reach the confirmation
    // screen (it stops at "Reservation #… created, but the payment provider returned no checkout URL").
    // Pick the offline "Pay with cash" method instead: it creates the order with no payment session
    // and lands on the success screen. The booking order POST asserted below is identical either way.
    const cashMethod = page
      .locator('#modalBody label')
      .filter({ hasText: /pay with/i })
      .first();
    await expect(cashMethod).toBeVisible({ timeout: FORM_SETTLE_MS });
    await cashMethod.click();

    const applyBtn = page.locator('#modalBody').first().getByRole('button', { name: /apply/i });
    await expect(applyBtn).toBeVisible({ timeout: FORM_SETTLE_MS });
    await applyBtn.click();

    // The booking order POST fires carrying the booking product (id 2071) + the form data.
    await expect.poll(() => orderBody, { timeout: 15_000 }).not.toBeNull();
    expect(orderBody!.products).toEqual(
      expect.arrayContaining([expect.objectContaining({ productId: 2071, quantity: 1 })])
    );
    expect(orderBody!.formData).toBeTruthy();

    // Success screen renders the (mocked) order number.
    await expect(page.getByText('№ 999999')).toBeVisible({ timeout: FORM_SETTLE_MS });
  });
});
