import { expect, type Page, test } from '@playwright/test';

import { getTestUserCreds, gotoAndReady, isMobile, signInAsTestUser } from './fixtures/helpers';

/**
 * reservation-stripe.spec.ts — live Stripe checkout for the booking (reservation) flow.
 *
 * The booking analogue of `payment-stripe.spec.ts` (delivery): sign in → open the booking form from a
 * restaurant → fill fields + pick a slot → Continue → payment step → select Stripe → land on the hosted
 * Stripe Checkout. This asserts the online-payment integration end-to-end on the app side
 * (`createReservation` → `Orders.createOrder(booking_order)` → `Payments.createSession` → `paymentUrl`
 * → redirect).
 *
 * Key facts baked in:
 *   • The booking product (id 2071, "Booking") costs a whole $10, so `Payments.createSession` does not
 *     hit the fractional-total 500 bug (ADMIN-TODO C.6.1) — the session yields a real checkout URL.
 *
 * Completing the payment ON the hosted Stripe page is intentionally NOT automated: the live hosted
 * Checkout re-renders as it initialises and varies its fields by geo/country (Link, full billing
 * address, possible 3DS), which makes card entry unavoidably flaky. Reaching `checkout.stripe.com`
 * already proves the reservation online-payment path works.
 *
 * Gated behind `E2E_STRIPE=1` because it hits the live backend and creates a real test-mode booking order.
 * Run with:  E2E_STRIPE=1 npx playwright test reservation-stripe --project=chromium --headed
 */
const RUN = !!process.env.E2E_STRIPE;
const STRIPE_CHECKOUT_RE = /checkout\.stripe\.com/;

// Booking fields render inside the staggered `FormFieldAnimations` wrapper (GSAP fade), so eager
// visibility checks race the timeline — give locators a generous settle budget.
const FORM_SETTLE_MS = 15_000;

/**
 * openBookingForm — opens the reservation popup from the first restaurant's detail page.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the booking form (`#name`) is visible.
 */
const openBookingForm = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/restaurants');
  const restaurantLink = page.locator('a[href^="/restaurants/"]').filter({ visible: true }).first();
  await expect(restaurantLink).toBeVisible({ timeout: 20_000 });
  const href = await restaurantLink.getAttribute('href');
  await page.goto(href!, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);

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
 * pickTimeSlot — drives the date/time picker: next month → the 15th → first available time → Apply.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the picker has applied and closed.
 */
const pickTimeSlot = async (page: Page): Promise<void> => {
  await page
    .getByRole('button', { name: /time slot/i })
    .first()
    .click();

  // The picker portals to <body> and reuses `id="modalBody"`; it is appended last.
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

  await expect(page.getByRole('button', { name: /next month/i })).toHaveCount(0);
};

/**
 * driveReservationToStripe — signs in, books a table, and walks the reservation wizard until the
 * browser lands on the hosted Stripe Checkout (Stripe payment method).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `checkout.stripe.com` is loaded.
 */
const driveReservationToStripe = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/');
  await signInAsTestUser(page);

  await openBookingForm(page);
  await fillBookingFields(page);
  await pickTimeSlot(page);

  // Authenticated → Continue goes straight to the payment step.
  await page
    .getByRole('button', { name: /continue/i })
    .first()
    .click();

  // Select the Stripe (card) method — its radio is `peer hidden`, so click its label. It is also the
  // default selection, but select explicitly for robustness. Skip if no Stripe method is configured.
  const stripeLabel = page.locator('label[for="pay-stripe"]');
  await expect(stripeLabel).toBeVisible({ timeout: FORM_SETTLE_MS });
  await stripeLabel.click();

  const apply = page.locator('#modalBody').first().getByRole('button', { name: /apply/i });
  await expect(apply).toBeVisible({ timeout: FORM_SETTLE_MS });
  await apply.click();

  await page.waitForURL(STRIPE_CHECKOUT_RE, { timeout: 45_000 });
};

test.describe.serial('Stripe payment flow (reservation / booking)', () => {
  // The flow (sign in → book → hosted Stripe Checkout) exceeds the default 60s per-test budget — the
  // reservation → Stripe leg alone is ~30s.
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    test.skip(
      !RUN,
      'Set E2E_STRIPE=1 to run the live Stripe reservation flow (creates a real test-mode booking order).'
    );
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local).');
    }
    test.skip(isMobile(page), 'Stripe checkout flow is asserted on desktop only.');
  });

  test('booking checkout with Stripe redirects to the hosted Stripe Checkout', async ({ page }) => {
    await driveReservationToStripe(page);
    await expect(page).toHaveURL(STRIPE_CHECKOUT_RE);
  });
});
