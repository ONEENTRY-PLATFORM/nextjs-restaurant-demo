import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import { addFirstProductToCart, gotoAndReady } from './fixtures/helpers';

/**
 * payment-cart-recovery.spec.ts — cart restore after an aborted Stripe checkout.
 *
 * Before redirecting to the hosted checkout, `useCreateOrder` wipes the cart but saves a snapshot
 * of its entries to localStorage (`checkout-cart-snapshot`, see `app/utils/checkoutCartSnapshot.ts`).
 * `PaymentCartRecovery` then consumes it: `/payment/cancel` restores the entries into Redux
 * (persisted back by redux-persist), `/payment/success` discards it. The Stripe hop itself is not
 * reproducible in E2E (external host), so the pre-redirect wipe is simulated directly on the
 * persisted store — the same localStorage state the app is left in when `window.location` flips.
 */

const SNAPSHOT_KEY = 'checkout-cart-snapshot';
const PERSIST_CART_KEY = 'persist:cart-slice';

type PersistedCartEntry = { id: number; quantity: number; selected: boolean };

/**
 * clearGuestStorage — wipes cookies + local/session storage so the cart starts empty.
 *
 * One-time clear (navigate to origin once, then wipe): `addInitScript` would re-clear on every
 * navigation and destroy the redux-persist cart mid-test.
 *
 * @param   {BrowserContext} context - Playwright browser context.
 * @param   {Page}           page    - Playwright page.
 * @returns Promise resolving once cookies and web storage are cleared.
 */
const clearGuestStorage = async (context: BrowserContext, page: Page): Promise<void> => {
  await context.clearCookies();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      /* SSR-safe */
    }
  });
};

/**
 * readPersistedCart — parses `productsData` out of the redux-persist cart record in localStorage.
 *
 * redux-persist double-serialises: the outer record is JSON whose whitelisted fields are themselves
 * JSON strings.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving to the persisted cart entries (empty array when absent/malformed).
 */
const readPersistedCart = async (page: Page): Promise<PersistedCartEntry[]> =>
  page.evaluate(key => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
      const outer = JSON.parse(raw) as { productsData?: string };
      return outer.productsData ? (JSON.parse(outer.productsData) as PersistedCartEntry[]) : [];
    } catch {
      return [];
    }
  }, PERSIST_CART_KEY);

/**
 * waitForPersistedCart — polls localStorage until the persisted cart is non-empty (redux-persist
 * flushes asynchronously after a dispatch).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once at least one entry is persisted.
 */
const waitForPersistedCart = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    key => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;
      try {
        const outer = JSON.parse(raw) as { productsData?: string };
        return !!outer.productsData && (JSON.parse(outer.productsData) as unknown[]).length > 0;
      } catch {
        return false;
      }
    },
    PERSIST_CART_KEY,
    { timeout: 20_000 }
  );
};

test.describe('Payment cart recovery — cancel restores, success discards', () => {
  test.beforeEach(async ({ context, page }) => {
    await clearGuestStorage(context, page);
  });

  test('cancel landing restores the cart wiped before the Stripe redirect', async ({ page }) => {
    // Build a real guest cart so the restored entry resolves to a live CMS product on /cart.
    await gotoAndReady(page, '/shop');
    const card = await addFirstProductToCart(page);
    const title = (await card.locator('.menu_item-title').innerText()).trim();
    expect(title.length).toBeGreaterThan(0);

    await waitForPersistedCart(page);
    const items = await readPersistedCart(page);
    expect(items.length).toBeGreaterThan(0);

    // Simulate the pre-redirect state left by useCreateOrder: snapshot saved, cart wiped.
    await page.evaluate(
      ({ snapshotKey, persistKey, entries }) => {
        window.localStorage.setItem(
          snapshotKey,
          JSON.stringify({ orderId: 999_999, savedAt: Date.now(), items: entries })
        );
        const raw = window.localStorage.getItem(persistKey);
        if (raw) {
          const outer = JSON.parse(raw) as Record<string, string>;
          outer.productsData = '[]';
          window.localStorage.setItem(persistKey, JSON.stringify(outer));
        }
      },
      { snapshotKey: SNAPSHOT_KEY, persistKey: PERSIST_CART_KEY, entries: items }
    );

    // Full navigation = what the Stripe cancel redirect does (fresh document, rehydrate from storage).
    await gotoAndReady(page, '/payment/cancel');

    // The snapshot is single-consumption: PaymentCartRecovery must remove it...
    await page.waitForFunction(key => window.localStorage.getItem(key) === null, SNAPSHOT_KEY, {
      timeout: 15_000,
    });
    // ...and the restored entries must be persisted back by redux-persist.
    await waitForPersistedCart(page);
    const restored = await readPersistedCart(page);
    expect(restored.map(entry => entry.id).sort()).toEqual(items.map(entry => entry.id).sort());

    // The cart page renders the restored row with the original product.
    await gotoAndReady(page, '/cart');
    await expect(page.locator('.product-in-cart').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('success landing discards the snapshot without restoring the cart', async ({ page }) => {
    // Seed only the snapshot — the paid cart must stay gone (id never rendered, so any id works).
    await page.evaluate(
      ({ snapshotKey }) => {
        window.localStorage.setItem(
          snapshotKey,
          JSON.stringify({
            orderId: 999_998,
            savedAt: Date.now(),
            items: [{ id: 123_456_789, quantity: 1, selected: true }],
          })
        );
      },
      { snapshotKey: SNAPSHOT_KEY }
    );

    await gotoAndReady(page, '/payment/success?orderId=999998');

    await page.waitForFunction(key => window.localStorage.getItem(key) === null, SNAPSHOT_KEY, {
      timeout: 15_000,
    });

    // Give redux-persist a beat to flush anything a (buggy) restore would have dispatched.
    await page.waitForTimeout(1_000);
    expect(await readPersistedCart(page)).toEqual([]);
  });
});
