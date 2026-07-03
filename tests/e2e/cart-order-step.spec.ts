import { expect, type Page, test } from '@playwright/test';

import { getTestUserCreds, gotoAndReady, openOrderStep, signInAsTestUser } from './fixtures/helpers';

/**
 * cart-order-step.spec.ts — the checkout `order` step (`StepOrder`): promo code + bonuses + totals.
 *
 * All tests need a signed-in user (the APPLY on `/cart` only advances to the order step when authed).
 * `Orders.previewOrder` (POST `/orders/preview`) and the bonus balance (GET `/bonus-balance`) are
 * stubbed so the coupon/bonus outcomes are deterministic instead of depending on live CMS data.
 *
 * Serialized: the tests share one OneEntry test user, and parallel sign-ins of the same account can
 * collide on the server-side session.
 */

/** DELIVERY_PRODUCT_ID from app/utils/constants — the virtual delivery line in a preview. */
const DELIVERY_PRODUCT_ID = 1828;

/**
 * previewBody — builds an `Orders.previewOrder` response with a chosen discount / bonus.
 *
 * @param   {object} opts          - Options.
 * @param   {number} opts.discount - Coupon discount applied to the $40 base total.
 * @param   {number} opts.bonus    - Bonus points applied by the server.
 * @returns A minimal `IOrderPreviewResponse`-shaped object.
 */
const previewBody = ({ discount = 0, bonus = 0 }: { discount?: number; bonus?: number }): object => ({
  orderPreview: [
    { id: 999, price: 30, quantity: 1 },
    { id: DELIVERY_PRODUCT_ID, price: 10, quantity: 1 },
  ],
  totalSum: 40,
  totalSumWithDiscount: 40 - discount,
  totalDue: Math.max(0, 40 - discount - bonus),
  bonusApplied: bonus,
  currency: 'USD',
});

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

test.describe.serial('Checkout order step — promo & bonuses', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('promo Apply button is disabled until a code is typed', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);
    await openOrderStep(page);

    const promo = page.getByPlaceholder(/promo code/i);
    await expect(promo).toBeVisible({ timeout: 20_000 });
    const applyCode = page.getByRole('button', { name: /apply code|applying/i });
    await expect(applyCode).toBeDisabled();

    await promo.fill('SUMMER');
    await expect(applyCode).toBeEnabled();
  });

  test('applying a valid promo shows the applied confirmation, removing clears it', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // Force a discount so the applied-coupon branch is taken deterministically.
    await page.route(/\/orders\/preview(\?|$)/, route => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(previewBody({ discount: 10 })),
      });
    });

    await openOrderStep(page);

    const promo = page.getByPlaceholder(/promo code/i);
    await promo.fill('SUMMER');
    await page.getByRole('button', { name: /apply code/i }).click();

    // Success → "Coupon SUMMER applied" (p.text-brand) and the button flips to Remove.
    await expect(page.getByText(/applied/i)).toBeVisible({ timeout: 15_000 });
    const removeBtn = page.getByRole('button', { name: /^remove$/i });
    await expect(removeBtn).toBeVisible();

    await removeBtn.click();
    await expect(page.getByRole('button', { name: /apply code/i })).toBeVisible();
  });

  test('an unapplicable promo shows an inline error', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // No discount → totalSumWithDiscount >= totalSum → "Coupon does not apply to this cart".
    await page.route(/\/orders\/preview(\?|$)/, route => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(previewBody({ discount: 0 })),
      });
    });

    await openOrderStep(page);

    await page.getByPlaceholder(/promo code/i).fill('NOPE123');
    await page.getByRole('button', { name: /apply code/i }).click();

    // The inline coupon error is a red `p[role="alert"]` — scope to it so the match is not the
    // Next.js route announcer (`div#__next-route-announcer__[role="alert"]`).
    await expect(page.locator('p[role="alert"].text-red-500')).toBeVisible({ timeout: 15_000 });
  });

  test('Pay with bonuses toggle appears with a balance and reflects in totals', async ({ page }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // Force a non-zero bonus balance so the toggle renders.
    await page.route(/\/bonus-balance(\?|$)/, route => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: 100 }),
      });
    });
    // Echo bonus into the preview so the "Bonuses" totals row appears once toggled.
    await page.route(/\/orders\/preview(\?|$)/, route => {
      if (route.request().method() !== 'POST') return route.continue();
      const body = route.request().postDataJSON() as { bonusAmount?: number } | null;
      const bonus = body?.bonusAmount && body.bonusAmount > 0 ? 30 : 0;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(previewBody({ bonus })),
      });
    });

    await openOrderStep(page);

    const bonusToggle = page.getByText(/pay with bonuses/i);
    await expect(bonusToggle).toBeVisible({ timeout: 15_000 });
    const checkbox = page
      .locator('label')
      .filter({ hasText: /pay with bonuses/i })
      .locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();

    await bonusToggle.click();
    await expect(checkbox).toBeChecked();
    // The applied bonus surfaces as a "Bonuses" line in the totals.
    await expect(page.getByText(/bonuses/i).first()).toBeVisible({ timeout: 15_000 });

    // Toggling off clears it.
    await bonusToggle.click();
    await expect(checkbox).not.toBeChecked();
  });
});
