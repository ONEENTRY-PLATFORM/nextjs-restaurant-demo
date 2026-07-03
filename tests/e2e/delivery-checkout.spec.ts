import { expect, type Page, test } from '@playwright/test';

import {
  getTestUserCreds,
  gotoAndReady,
  isMobile,
  openPaymentStep,
  signInAsTestUser,
} from './fixtures/helpers';

/**
 * delivery-checkout.spec.ts — the delivery checkout `payment` step (`StepPayment`) end-to-end.
 *
 * Covers the address/time/payment layout, the ASAP↔scheduled time picker, payment-method selection,
 * and the full **cash** happy path to the Success screen. The order-creation POST is stubbed
 * (`/marker/<storage>/orders`) and the payment-session POST is aborted, so no real order or payment
 * is created — the same approach as `reservation.spec.ts`.
 *
 * Serialized: the tests share one OneEntry test user.
 */

/**
 * signInOrSkip — signs the test user in, skipping (not failing) when the creds are rejected.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once signed in; otherwise the test is skipped.
 */
const signInOrSkip = async (page: Page): Promise<void> => {
  try {
    await signInAsTestUser(page);
  } catch (err) {
    test.skip(true, err instanceof Error ? err.message : 'OneEntry auth failed for the E2E user');
  }
};

test.describe.serial('Delivery checkout — payment step', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('renders the address, time and payment sections', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openPaymentStep(page);

    // Time section: both ASAP and scheduled radios exist.
    await expect(page.locator('#time-asap')).toHaveCount(1);
    await expect(page.locator('#time-scheduled')).toHaveCount(1);

    // Payment section: the radios are `peer hidden` (visually hidden), so assert on the visible
    // method label or the empty-state text.
    const methodLabel = page.locator('label[for^="pay-"]');
    const emptyState = page.getByText(/no payment methods are configured/i);
    await expect(methodLabel.first().or(emptyState)).toBeVisible({ timeout: 15_000 });
  });

  test('switching to scheduled time opens the slot picker', async ({ page }) => {
    test.skip(isMobile(page), 'Scheduled picker is asserted on desktop only.');
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openPaymentStep(page);

    // Clicking the readonly schedule input opens the DateTimePickerSheet (calendar days appear).
    await page.locator('#time-scheduled ~ input[readonly], input[readonly]').first().click();
    await expect(page.locator('button.calend_days').first()).toBeVisible({ timeout: 15_000 });
  });

  test('selecting a payment method checks its radio', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openPaymentStep(page);

    // Wait for the async payment accounts to resolve (a method label) or the empty-state.
    const anyLabel = page.locator('label[for^="pay-"]').first();
    const emptyState = page.getByText(/no payment methods are configured/i);
    await expect(anyLabel.or(emptyState)).toBeVisible({ timeout: 20_000 });

    const radios = page.locator('input[name="payment-method"]');
    const count = await radios.count();
    if (count === 0) test.skip(true, 'No payment methods configured for this project.');

    // The first method is auto-selected on mount.
    await expect(radios.first()).toBeChecked();

    // If a second method exists, clicking its (visually-hidden) radio's label selects it.
    if (count > 1) {
      const secondId = await radios.nth(1).getAttribute('id');
      await page.locator(`label[for="${secondId}"]`).click();
      await expect(radios.nth(1)).toBeChecked();
      await expect(radios.first()).not.toBeChecked();
    }
  });

  test('cash checkout creates an order and shows the Success screen', async ({ page }) => {
    test.skip(isMobile(page), 'Cash checkout is asserted on desktop only.');
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // Stub order creation (no real order) and block any payment session (cash should not create one).
    await page.route(/\/marker\/[^/]+\/orders(\?|$)/, route => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 555001, paymentAccountIdentifier: 'cash' }),
      });
    });
    await page.route(/\/sessions(\?|$)/, route => route.abort());

    await openPaymentStep(page);

    // Wait for the async payment accounts to resolve before probing for the cash method.
    const anyLabel = page.locator('label[for^="pay-"]').first();
    const emptyState = page.getByText(/no payment methods are configured/i);
    await expect(anyLabel.or(emptyState)).toBeVisible({ timeout: 20_000 });

    // Cash is an offline account → confirming lands on Success without a hosted checkout.
    const cashRadio = page.locator('#pay-cash');
    if ((await cashRadio.count()) === 0) {
      test.skip(true, 'No cash (offline) payment method configured — cannot assert the cash path.');
    }
    await page.locator('label[for="pay-cash"]').click();

    // Fill the required delivery address if the profile did not pre-fill it.
    const address = page.getByRole('textbox').first();
    await expect(address).toBeVisible({ timeout: 10_000 });
    if (!(await address.inputValue())) {
      await address.fill('E2E Test Street 1');
    }

    const apply = page.locator('button.step-payment-row.cart_btn').first();
    await expect(apply).toBeEnabled({ timeout: 10_000 });
    await apply.click();

    // Success screen renders the (mocked) order number `–555001`.
    await expect(page.getByText('–555001')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('a[href="/profile/orders"]')).toBeVisible();
  });
});
