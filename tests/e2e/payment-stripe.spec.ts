import { expect, type Page, test } from '@playwright/test';
import { defineOneEntry } from 'oneentry';

import { getTestUserCreds, gotoAndReady, isMobile, signInAsTestUser } from './fixtures/helpers';

/**
 * payment-stripe.spec.ts — live Stripe checkout flow for the delivery cart.
 *
 * Drives the real UI from localhost: sign in → add a whole-dollar product → checkout → select Stripe
 * → reach the hosted Stripe Checkout → pay with the `4242…` test card → land on the demo success page.
 *
 * Key facts baked in:
 *   • Stripe's success/cancel URLs are configured on the OneEntry account, NOT derived from the
 *     request origin — so paying from `localhost:3000` redirects to
 *     `https://oneentry-nextjs-restaurant-demo.vercel.app/payment/success` (a DIFFERENT origin).
 *   • OneEntry's payment-session endpoint 500s on a fractional order total (ADMIN-TODO C.6.1), so the
 *     cart is built to a whole-dollar total (whole-dollar product + the $10 delivery line).
 *
 * Gated behind `E2E_STRIPE=1` because it hits the live backend, creates real test-mode orders, and
 * (second test) completes a real Stripe TEST payment that ends on the production demo deployment.
 * Run with:  E2E_STRIPE=1 npx playwright test payment-stripe --project=chromium --headed
 *
 * Prerequisites for the delivery `createOrder` to pass: the E2E user must have a phone on file
 * (`contact_phone` is a required strict field, sourced from the user's profile in the UI).
 */
const RUN = !!process.env.E2E_STRIPE;
const STRIPE_CHECKOUT_RE = /checkout\.stripe\.com/;
const DEMO_SUCCESS_RE = /oneentry-nextjs-restaurant-demo\.vercel\.app\/payment\/success/;

type ProductLike = {
  id: number;
  statusIdentifier?: string;
  attributeValues?: { price?: { value?: number } };
};

const api = defineOneEntry(
  (process.env.NEXT_PUBLIC_ONEENTRY_URL || process.env.NEXT_PUBLIC_PROJECT_URL) as string,
  {
    langCode: 'en_US',
    token: (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN || process.env.NEXT_PUBLIC_APP_TOKEN) as string,
    auth: { saveFunction: async (): Promise<void> => {} },
  }
);

let integerProductId = 0;

/**
 * findIntegerProductId — finds an in-stock product whose whole-dollar price keeps the order total
 * integer once the $10 delivery line is added (so `Payments.createSession` does not hit the C.6.1 bug).
 *
 * @returns Promise resolving to the product id.
 */
const findIntegerProductId = async (): Promise<number> => {
  const resp = await api.Products.getProducts([], 'en_US', { offset: 0, limit: 100 });
  const items = (
    Array.isArray(resp) ? resp : ((resp as { items?: unknown[] })?.items ?? [])
  ) as ProductLike[];
  const priceOf = (p: ProductLike): number => Number(p?.attributeValues?.price?.value ?? NaN);
  const product = items.find(
    p => p?.statusIdentifier !== 'out_of_stock' && Number.isInteger(priceOf(p)) && priceOf(p) > 0
  );
  if (!product) throw new Error('No whole-dollar in-stock product found for the Stripe e2e.');
  return product.id;
};

/**
 * driveDeliveryCheckoutToStripe — signs in, builds a whole-dollar cart, and walks the checkout wizard
 * until the browser lands on the hosted Stripe Checkout.
 *
 * @param   {Page} page - Playwright page.
 * @returns Promise resolving once `checkout.stripe.com` is loaded.
 */
const driveDeliveryCheckoutToStripe = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/');
  await signInAsTestUser(page);

  // Add the whole-dollar product (qty 1) → cart total = price + $10 delivery stays an integer.
  await page.goto(`/shop/product/${integerProductId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.shop_section')).toBeVisible({ timeout: 20_000 });
  const cta = page.getByRole('button', { name: /to cart|out of stock/i }).first();
  await expect(cta).toBeVisible({ timeout: 20_000 });
  if (await cta.isDisabled()) test.skip(true, 'whole-dollar product is out of stock');
  await cta.click();

  // Cart → order → payment. The wizard starts on the `cart` step (the step is NOT persisted, so a
  // full nav to /cart always rehydrates to step 'cart'): the cart listing renders first, then
  // StepOrder, then StepPayment. Each transition needs its own click.
  await gotoAndReady(page, '/cart');

  // Guard the auth race: after a full reload `isAuth` is restored asynchronously from the stored
  // token. Clicking the cart APPLY before that lands on the guest path (opens the auth modal), so
  // wait for the header to show the authenticated Profile link first.
  await expect(
    page
      .locator('header')
      .getByRole('link', { name: /profile/i })
      .first()
  ).toBeVisible({ timeout: 15_000 });

  // cart step → order step (authed APPLY dispatches setStep('order')).
  const cartApply = page.locator('button.cart-apply-btn').first();
  await expect(cartApply).toBeVisible({ timeout: 20_000 });
  await cartApply.click();

  // order step → payment step (StepOrder's proceed button is the only `step-order-row` + `bg-brand`).
  const proceed = page.locator('button.step-order-row.bg-brand').first();
  await expect(proceed).toBeVisible({ timeout: 20_000 });
  await proceed.click();

  // Payment step: pick Stripe (radio input is visually hidden — click its label), ensure the
  // required address is filled, then submit.
  const stripeOption = page.locator('label[for="pay-stripe"]');
  await expect(stripeOption).toBeVisible({ timeout: 20_000 });
  await stripeOption.click();

  const addressInput = page.getByRole('textbox').first();
  await expect(addressInput).toBeVisible({ timeout: 10_000 });
  if (!(await addressInput.inputValue())) {
    await addressInput.fill('E2E Test Street 1');
  }

  const apply = page.locator('button.cart_btn').first();
  await expect(apply).toBeEnabled({ timeout: 10_000 });
  await apply.click();

  await page.waitForURL(STRIPE_CHECKOUT_RE, { timeout: 45_000 });
};

/**
 * fillStripeTestCard — completes the hosted Stripe Checkout with the `4242` test card and submits.
 *
 * The hosted Checkout page uses native inputs (not the Elements iframes), so fields are addressed by
 * their stable ids. Only fields actually rendered are filled (config-dependent).
 *
 * @param   {Page} page - Playwright page (already on `checkout.stripe.com`).
 * @returns Promise resolving once the Pay button is clicked.
 */
const fillStripeTestCard = async (page: Page): Promise<void> => {
  await page.waitForURL(STRIPE_CHECKOUT_RE, { timeout: 45_000 });

  const typeInto = async (selector: string, value: string): Promise<void> => {
    const input = page.locator(selector).first();
    if (await input.isVisible().catch(() => false)) {
      await input.click();
      await input.fill('');
      await input.pressSequentially(value, { delay: 20 });
    }
  };

  await typeInto('#email', 'e2e-stripe@example.com');
  await typeInto('#cardNumber', '4242424242424242');
  await typeInto('#cardExpiry', '1234'); // 12 / 34 → Dec 2034
  await typeInto('#cardCvc', '123');
  await typeInto('#billingName', 'E2E Test User');
  await typeInto('#billingPostalCode', '12345');

  const submit = page
    .locator('[data-testid="hosted-payment-submit-button"], button.SubmitButton')
    .first();
  await expect(submit).toBeVisible({ timeout: 15_000 });
  await submit.click();
};

test.describe.serial('Stripe payment flow (delivery checkout)', () => {
  test.beforeAll(async () => {
    if (!RUN || !getTestUserCreds()) return;
    integerProductId = await findIntegerProductId();
  });

  test.beforeEach(async ({ page }) => {
    test.skip(
      !RUN,
      'Set E2E_STRIPE=1 to run the live Stripe checkout flow (creates real test-mode orders).'
    );
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local).');
    }
    test.skip(isMobile(page), 'Stripe checkout flow is asserted on desktop only.');
  });

  test('delivery checkout with Stripe redirects to the hosted Stripe Checkout', async ({
    page,
  }) => {
    await driveDeliveryCheckoutToStripe(page);
    await expect(page).toHaveURL(STRIPE_CHECKOUT_RE);
  });

  test('paying with the 4242 test card redirects to the demo /payment/success', async ({
    page,
  }) => {
    await driveDeliveryCheckoutToStripe(page);
    await fillStripeTestCard(page);

    // Stripe sends the buyer to the URL configured on the OneEntry account — the demo deployment,
    // not localhost.
    await page.waitForURL(DEMO_SUCCESS_RE, { timeout: 60_000 });
    await expect(page).toHaveURL(DEMO_SUCCESS_RE);
  });
});
