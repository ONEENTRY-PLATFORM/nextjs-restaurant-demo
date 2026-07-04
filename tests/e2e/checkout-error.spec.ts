import { expect, type Page, test } from '@playwright/test';

import {
  getTestUserCreds,
  gotoAndReady,
  isMobile,
  openPaymentStep,
  signInAsTestUser,
} from './fixtures/helpers';

/**
 * checkout-error.spec.ts — the delivery checkout `error` screen (`StepResult variant="error"`).
 *
 * Exercises the online-payment failure branch of `StepPayment` + `useCreateOrder`: an online (stripe)
 * account creates the order, but `Payments.createSession` returns no `paymentUrl`, so `onConfirmOrder`
 * resolves `{ ok: false, error: '…returned no checkout URL.' }`, `StepPayment` dispatches `setStepError`
 * and the wizard lands on the error step. Both the order POST (`/marker/<storage>/orders`) and the
 * session POST (`/sessions`) are stubbed, so no real order or payment session is created.
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

test.describe.serial('Delivery checkout — payment error step', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('online payment without a checkout URL lands on the error screen', async ({ page }) => {
    test.skip(isMobile(page), 'Online payment error path is asserted on desktop only.');
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // Stub order creation (online/stripe account) and force the payment session to come back empty —
    // no `paymentUrl` → `useCreateOrder` returns `{ ok: false }` → the wizard shows the error screen.
    await page.route(/\/marker\/[^/]+\/orders(\?|$)/, route => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 555002, paymentAccountIdentifier: 'stripe' }),
      });
    });
    await page.route(/\/sessions(\?|$)/, route => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await openPaymentStep(page);

    // Wait for the async payment accounts to resolve before probing for the stripe method.
    const anyLabel = page.locator('label[for^="pay-"]').first();
    const emptyState = page.getByText(/no payment methods are configured/i);
    await expect(anyLabel.or(emptyState)).toBeVisible({ timeout: 20_000 });

    // Requires an online (stripe) method — the whole error branch only fires for online accounts.
    const stripeRadio = page.locator('#pay-stripe');
    if ((await stripeRadio.count()) === 0) {
      test.skip(true, 'No online (stripe) payment method configured — cannot assert the error path.');
    }
    await page.locator('label[for="pay-stripe"]').click();
    await expect(stripeRadio).toBeChecked();

    // Fill the required delivery address if the profile did not pre-fill it.
    const address = page.getByRole('textbox').first();
    await expect(address).toBeVisible({ timeout: 10_000 });
    if (!(await address.inputValue())) {
      await address.fill('E2E Test Street 1');
    }

    const apply = page.locator('button.step-payment-row.cart_btn').first();
    await expect(apply).toBeEnabled({ timeout: 10_000 });
    await apply.click();

    // Error screen: the "Something went wrong." heading, the specific no-checkout-URL detail, and the
    // "Back to cart" CTA.
    await expect(page.getByText(/something went wrong/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/no checkout url|payment provider/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /back to cart/i })).toBeVisible();
  });
});
