import { expect, type Page, test } from '@playwright/test';

import {
  getTestUserCreds,
  gotoAndReady,
  openPaymentStep,
  signInAsTestUser,
} from './fixtures/helpers';

/**
 * checkout-payment-details.spec.ts — UI details of the delivery checkout `payment` step (`StepPayment`).
 *
 * Covers two gated affordances without submitting an order: the "another person" checkbox that reveals
 * the alt-phone input (and blocks APPLY while it is empty), and the address row's change-address
 * dropdown (saved addresses / empty-state + "Add Address"). No mutation is mocked because no order is
 * created — the tests only assert local UI state.
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

test.describe.serial('Delivery checkout — payment step details', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('"another person" reveals the alt-phone input and gates APPLY', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openPaymentStep(page);

    // Wait for the async delivery form to render (the time row is a reliable signal) before the
    // one-shot count() skip-check below.
    await expect(page.locator('#time-asap')).toBeAttached({ timeout: 20_000 });

    // The alt-phone row is gated on the `alt_phone` form attribute. It is the only custom-checkbox on
    // the payment step; match by class (its label text is dictionary-driven). Skip when not configured.
    const altCheckbox = page.locator('label.step-payment-row.custom-checkbox').first();
    if ((await altCheckbox.count()) === 0) {
      test.skip(true, 'alt_phone field is not configured on the delivery form.');
    }
    await expect(altCheckbox).toBeVisible({ timeout: 20_000 });

    // Let the async payment accounts settle so the first method auto-selects (needed for the APPLY gate).
    const anyLabel = page.locator('label[for^="pay-"]').first();
    const emptyState = page.getByText(/no payment methods are configured/i);
    await expect(anyLabel.or(emptyState)).toBeVisible({ timeout: 20_000 });

    // Satisfy the required address so APPLY's only remaining blocker is the empty alt phone.
    const address = page.getByRole('textbox').first();
    if ((await address.isVisible().catch(() => false)) && !(await address.inputValue())) {
      await address.fill('E2E Test Street 1');
    }

    const apply = page.locator('button.step-payment-row.cart_btn').first();
    const hasMethod = (await page.locator('input[name="payment-method"]').count()) > 0;

    // Toggling the checkbox reveals the tel input.
    await altCheckbox.click();
    const altPhone = page.locator('input[type="tel"]').first();
    await expect(altPhone).toBeVisible({ timeout: 10_000 });

    // With a payment method selected + address filled, the empty alt phone is the sole APPLY blocker;
    // filling it re-enables the button.
    if (hasMethod) {
      await expect(apply).toBeDisabled();
      await altPhone.fill('+15551234567');
      await expect(apply).toBeEnabled();
    }
  });

  test('change-address control opens the saved-address dropdown', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openPaymentStep(page);

    // Wait for the async delivery form to render before the one-shot count() skip-check.
    await expect(page.locator('#time-asap')).toBeAttached({ timeout: 20_000 });

    // The change-address pencil is the only `aria-expanded` button on the payment step (its aria-label
    // is dictionary-driven, so match structurally). It renders only when the `delivery_address` row is
    // present — skip otherwise.
    const pencil = page.locator('.step-payment-row button[aria-expanded]').first();
    if ((await pencil.count()) === 0) {
      test.skip(true, 'delivery_address row (with the change-address control) is not configured.');
    }
    await expect(pencil).toBeVisible({ timeout: 20_000 });
    await pencil.click();

    // Dropdown opened → aria-expanded flips and the saved-address menu (`.top-full` panel) appears,
    // showing either saved-address buttons or the empty-state.
    await expect(pencil).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.step-payment-row .absolute.top-full').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
