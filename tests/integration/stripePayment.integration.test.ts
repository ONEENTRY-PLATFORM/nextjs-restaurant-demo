/**
 * stripePayment.integration.test.ts — live OneEntry/Stripe payment-flow integration tests.
 *
 * Exercises the REAL backend (no SDK mocks, per the project's testing convention): signs in as the
 * configured E2E user, then drives the same SDK calls the app makes at checkout —
 * `Payments.getAccounts`, `Orders.previewOrder`, `Orders.createOrder`, `Payments.createSession`.
 *
 * What it proves:
 *   1. The Stripe account is connected and its success/cancel redirect URLs point at the demo
 *      deployment (`oneentry-nextjs-restaurant-demo.vercel.app`). From localhost the browser is sent
 *      to THIS host after paying — Stripe uses the URLs configured on the OneEntry account, not the
 *      request origin.
 *   2. A whole-dollar order opens a real Stripe TEST checkout session (`checkout.stripe.com/...`) —
 *      the entry point a buyer reaches to pay with the `4242…` test card.
 *   3. A SENTINEL for the known OneEntry server bug: `createSession` 500s on a fractional total
 *      (see .claude/rules/ONEENTRY-ADMIN-TODO.md C.6.1). When the server is fixed this test flips.
 *
 * NOTE: each run creates a couple of test-mode orders in OneEntry (one whole-dollar, one fractional)
 * and one Stripe test session. It is intentionally excluded from the default `npm test` / `prebuild`
 * run — invoke explicitly via `npm run test:integration`. Requires `.env.local` with
 * `NEXT_PUBLIC_ONEENTRY_*`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import { defineOneEntry } from 'oneentry';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';

import { DELIVERY_PRODUCT_ID, FORMS } from '@/app/utils/constants';

const PROJECT_URL = process.env.NEXT_PUBLIC_ONEENTRY_URL || process.env.NEXT_PUBLIC_PROJECT_URL;
const APP_TOKEN = process.env.NEXT_PUBLIC_ONEENTRY_TOKEN || process.env.NEXT_PUBLIC_APP_TOKEN;
const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

/**
 * Redirect URLs configured on the Stripe account in the OneEntry admin panel
 * (Payments → stripe → testSettings). Pinned so a change in the admin trips this test.
 */
const EXPECTED_SUCCESS_URL = 'https://oneentry-nextjs-restaurant-demo.vercel.app/payment/success';
const EXPECTED_CANCEL_URL = 'https://oneentry-nextjs-restaurant-demo.vercel.app/payment/cancel';

const credsPresent = Boolean(PROJECT_URL && APP_TOKEN && EMAIL && PASSWORD);

type ErrLike = { statusCode?: number; message?: string };
type OrderResult = ErrLike & { id: number; paymentAccountIdentifier?: string };
type SessionResult = ErrLike & { paymentUrl?: string | null; amount?: number };
type PreviewResult = ErrLike & { totalSum?: number; currency?: string };
type StripeSettings = { status?: string; successUrl?: string; cancelUrl?: string };
type ProductLike = {
  id: number;
  statusIdentifier?: string;
  attributeValues?: { price?: { value?: number } };
};

const api = defineOneEntry(PROJECT_URL as string, {
  langCode: 'en_US',
  token: APP_TOKEN as string,
  auth: { saveFunction: async (): Promise<void> => {} },
});

/**
 * isErr — OneEntry SDK error discriminator (mirrors `app/api/api/api.ts#isError`).
 *
 * @param   {unknown} r - Any SDK response.
 * @returns `true` when `r` carries a numeric `statusCode` (an SDK error envelope).
 */
const isErr = (r: unknown): r is ErrLike =>
  !!r && typeof r === 'object' && typeof (r as ErrLike).statusCode === 'number';

/**
 * priceOf — reads a product's numeric `price` attribute value.
 *
 * @param   {ProductLike} p - OneEntry product entity.
 * @returns The price as a number, or `NaN` when absent.
 */
const priceOf = (p: ProductLike): number => Number(p?.attributeValues?.price?.value ?? NaN);

let productCache: ProductLike[] | undefined;

/**
 * getInStockProducts — fetches and caches in-stock, positively-priced catalog products.
 *
 * @returns Promise resolving to the filtered product list.
 */
const getInStockProducts = async (): Promise<ProductLike[]> => {
  if (productCache) return productCache;
  const resp = await api.Products.getProducts([], 'en_US', { offset: 0, limit: 100 });
  const items = (
    Array.isArray(resp) ? resp : ((resp as { items?: unknown[] })?.items ?? [])
  ) as ProductLike[];
  productCache = items.filter(
    p => p?.statusIdentifier !== 'out_of_stock' && Number.isFinite(priceOf(p)) && priceOf(p) > 0
  );
  return productCache;
};

/**
 * pickProductByTotalParity — finds a product whose price makes `price + delivery` whole or fractional.
 *
 * Delivery is a whole-dollar line item, so an integer-priced product yields a whole order total
 * (dodges the C.6.1 fractional-amount bug) and a `.5`-priced product yields a fractional total.
 *
 * @param   {boolean} wantInteger - `true` for a whole-dollar-priced product, `false` for fractional.
 * @returns Promise resolving to the chosen product, or `undefined` when none match.
 */
const pickProductByTotalParity = async (wantInteger: boolean): Promise<ProductLike | undefined> => {
  const products = await getInStockProducts();
  return products.find(p => Number.isInteger(priceOf(p)) === wantInteger);
};

/**
 * createDeliveryOrder — creates a `delivery_order` paid by Stripe with explicit required form data.
 *
 * Passing `delivery_address` + `contact_phone` directly keeps the test independent of the E2E user's
 * saved address book / profile phone.
 *
 * @param   {Array<{ productId: number; quantity: number }>} products - Order line items.
 * @returns Promise resolving to the created-order SDK response.
 */
const createDeliveryOrder = async (
  products: Array<{ productId: number; quantity: number }>
): Promise<OrderResult> =>
  (await api.Orders.createOrder(FORMS.deliveryOrder, {
    formIdentifier: FORMS.deliveryOrder,
    paymentAccountIdentifier: stripeIdentifier || 'stripe',
    formData: [
      { marker: 'delivery_address', type: 'string', value: 'Integration Test St 1' },
      { marker: 'contact_phone', type: 'string', value: '+10000000000' },
    ],
    products,
  })) as unknown as OrderResult;

let stripeIdentifier = '';

const describeIf = credsPresent ? describe : describe.skip;

describeIf('Stripe payment flow (OneEntry integration)', () => {
  beforeAll(async () => {
    const auth = await api.AuthProvider.auth('email', {
      authData: [
        { marker: 'email', value: EMAIL as string },
        { marker: 'password', value: PASSWORD as string },
      ],
    });
    if (isErr(auth)) {
      throw new Error(
        `OneEntry auth failed for E2E_USER_EMAIL (${auth.statusCode} ${auth.message}). Set valid creds in .env.local.`
      );
    }
    const accounts = await api.Payments.getAccounts();
    if (!isErr(accounts)) {
      stripeIdentifier =
        (accounts as IAccountsEntity[]).find(a => a.type === 'stripe')?.identifier ?? '';
    }
  });

  it('exposes a stripe account with the demo success/cancel redirect URLs', async () => {
    const accounts = await api.Payments.getAccounts();
    expect(isErr(accounts)).toBe(false);

    const stripe = (accounts as IAccountsEntity[]).find(a => a.type === 'stripe');
    expect(stripe).toBeDefined();
    expect(stripe?.isVisible).not.toBe(false);
    expect(stripe?.isUsed).not.toBe(false);

    // The connected onboarding lives under `testSettings` in test mode; fall back to `settings`.
    const acc = stripe as unknown as { testSettings?: StripeSettings; settings?: StripeSettings };
    const settings =
      acc.testSettings?.successUrl != null ? acc.testSettings : (acc.settings ?? acc.testSettings);
    expect(settings?.successUrl).toBe(EXPECTED_SUCCESS_URL);
    expect(settings?.cancelUrl).toBe(EXPECTED_CANCEL_URL);
  });

  it('opens a Stripe checkout session for a whole-dollar order (test payment entry point)', async () => {
    expect(stripeIdentifier).toBeTruthy();

    const product = await pickProductByTotalParity(true);
    expect(product).toBeDefined();
    const products = [
      { productId: (product as ProductLike).id, quantity: 1 },
      { productId: DELIVERY_PRODUCT_ID, quantity: 1 },
    ];

    // Confirm the server-authoritative total is a whole dollar amount before creating the order.
    const preview = (await api.Orders.previewOrder({ products })) as unknown as PreviewResult;
    expect(isErr(preview)).toBe(false);
    expect(Number.isInteger(preview.totalSum)).toBe(true);

    const order = await createDeliveryOrder(products);
    expect(isErr(order)).toBe(false);
    expect(typeof order.id).toBe('number');

    const session = (await api.Payments.createSession(
      order.id,
      'session'
    )) as unknown as SessionResult;
    expect(isErr(session)).toBe(false);
    expect(typeof session.paymentUrl).toBe('string');
    // Hosted Stripe TEST checkout — this is the URL the app redirects the browser to.
    expect(session.paymentUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  it('SENTINEL: createSession 500s on a fractional total (known OneEntry bug — ADMIN-TODO C.6.1)', async () => {
    const product = await pickProductByTotalParity(false);
    if (!product) {
      // No fractional-priced product in the sample — nothing to assert (data-dependent).
      // eslint-disable-next-line no-console
      console.warn('No fractional-priced product found; skipping the fractional-amount sentinel.');
      return;
    }
    const products = [
      { productId: product.id, quantity: 1 },
      { productId: DELIVERY_PRODUCT_ID, quantity: 1 },
    ];

    const preview = (await api.Orders.previewOrder({ products })) as unknown as PreviewResult;
    expect(isErr(preview)).toBe(false);
    expect(Number.isInteger(preview.totalSum)).toBe(false);

    const order = await createDeliveryOrder(products);
    expect(isErr(order)).toBe(false);

    const session = (await api.Payments.createSession(
      order.id,
      'session'
    )) as unknown as SessionResult;

    // Known server bug: the session amount is persisted to an integer (dollars) column, so any
    // fractional total fails the INSERT with `invalid input syntax for type integer`. When OneEntry
    // stores the amount in cents / numeric, createSession will succeed and these assertions flip —
    // that is the signal to re-enable fractional Stripe checkout and close ADMIN-TODO C.6.1.
    expect(isErr(session)).toBe(true);
    expect(session.statusCode).toBe(500);
    expect(String(session.message)).toMatch(/integer/i);
  });
});
