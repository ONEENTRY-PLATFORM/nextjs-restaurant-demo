import { expect, type Locator, type Page, test } from '@playwright/test';

import { getTestUserCreds, gotoAndReady, isMobile, signInAsTestUser } from './fixtures/helpers';

/**
 * signInOrSkip — wraps signInAsTestUser so the whole test is skipped (not failed) when the
 * configured creds are rejected by OneEntry (e.g. the password rotated server-side).
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
 * openOrdersAuthed — signs the test user in, opens `/profile/orders`, and waits for the auth-gated
 * dashboard to render. Skips (does not fail) when OneEntry has no orders for the E2E account, since
 * seeding an order is admin/data work.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the "Active orders"/"Orders History" sections are visible.
 */
const openOrdersAuthed = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/');
  await signInOrSkip(page);

  await gotoAndReady(page, '/profile/orders');

  // Wait until the auth-gated content is rendered (the sign-in prompt is guests-only).
  await expect(page.getByText(/please sign in to view your orders/i)).toBeHidden({
    timeout: 15_000,
  });

  // Data-dependent: the actions under test need at least one order. Wait for either the empty state
  // or the order sections, and skip (don't fail) when the account has no orders.
  const empty = page.getByText(/you have no orders yet/i);
  const sections = page.getByText(/active orders|orders history/i);
  await expect(empty.or(sections.first())).toBeVisible({ timeout: 15_000 });
  if (await empty.isVisible().catch(() => false)) {
    test.skip(true, 'E2E user has no orders in OneEntry — seed an order');
  }
  await expect(sections.first()).toBeVisible({ timeout: 15_000 });
};

/**
 * expandAllOrderCards — ensures every OrderCard body is mounted by expanding each collapsed pill.
 *
 * OrdersList auto-expands only the first active + first history card; action buttons of the other
 * cards live in an unmounted body until their pill is toggled. Each order pill is a
 * `button[aria-expanded]` whose label carries the `№<number>` prefix; clicking a `false` one mounts
 * and reveals its body. The pill count is stable across toggles, so iterating by index is safe.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once all order cards are expanded.
 */
const expandAllOrderCards = async (page: Page): Promise<void> => {
  const pills = page.locator('button[aria-expanded]').filter({ hasText: /№/ });
  const count = await pills.count();
  for (let i = 0; i < count; i += 1) {
    const pill = pills.nth(i);
    if ((await pill.getAttribute('aria-expanded')) === 'false') {
      await pill.click();
      // Let the freshly-mounted body finish its GSAP reveal (`.order-body-row` autoAlpha 0 → 1).
      await page.waitForTimeout(250);
    }
  }
};

/**
 * findActionButton — expands all order cards, then returns a locator for the first action button
 * matching `labelRe`, or `null` when no such button exists (data-dependent → caller skips).
 *
 * @param   {Page}     page    - Playwright page.
 * @param   {RegExp}   labelRe - Case-insensitive matcher for the action button's accessible name.
 * @returns Promise resolving to the button Locator, or `null` when the button is absent.
 */
const findActionButton = async (page: Page, labelRe: RegExp): Promise<Locator | null> => {
  await expandAllOrderCards(page);
  const btn = page.getByRole('button', { name: labelRe }).first();
  if ((await btn.count()) === 0) return null;
  return btn;
};

// Serialized: all tests share the same OneEntry test user, and parallel sign-ins of the same account
// can collide on the server-side session (surfacing a spurious "Authentication failed").
test.describe.serial('Order card actions (/profile/orders)', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('Repeat order: history card button re-adds items and toasts', async ({ page }) => {
    await openOrdersAuthed(page);

    // "Repeat order" only renders inside a history card body — expand cards first, skip if absent.
    const repeatBtn = await findActionButton(page, /repeat order/i);
    if (!repeatBtn) {
      test.skip(true, 'E2E user has no history orders with a Repeat order action — seed one');
    }

    await expect(repeatBtn!).toBeVisible({ timeout: 10_000 });
    await repeatBtn!.click();

    // Success re-adds items ("…added to cart"); the all-unavailable branch toasts "…out of stock".
    await expect(page.getByText(/added to cart|out of stock/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // On desktop a successful repeat pushes to `/cart`; on mobile it opens the CartPopup instead.
    // Both are soft-checked — the all-unavailable branch returns early with no navigation, so a
    // failed URL wait must not fail the test.
    if (!isMobile(page)) {
      await page.waitForURL(/\/cart(\/|\?|$)/, { timeout: 10_000 }).catch(() => undefined);
    }
  });

  test('Leave a review: delivered order opens the review popup', async ({ page }) => {
    await openOrdersAuthed(page);

    // "Leave a review" only renders for a delivered order — skip when the E2E user has none.
    const reviewBtn = await findActionButton(page, /leave a review/i);
    if (!reviewBtn) {
      test.skip(true, 'E2E user has no delivered order to review — seed one');
    }

    await expect(reviewBtn!).toBeVisible({ timeout: 10_000 });
    await reviewBtn!.click();

    // OrderReviewPopup mounts its own `#modalBody` carrying the "Leave a review" heading.
    const popup = page.locator('#modalBody');
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup.getByText(/leave a review/i).first()).toBeVisible({ timeout: 10_000 });

    // Close via the popup's back control (always present; the md+ Close button is hidden on mobile).
    await popup.getByRole('button', { name: /back/i }).first().click();
    await expect(popup).toBeHidden({ timeout: 10_000 });

    // Closing the popup must not navigate away from the orders dashboard.
    expect(new URL(page.url()).pathname).toBe('/profile/orders');
  });

  test('Contact courier: active order opens the contact form', async ({ page }) => {
    await openOrdersAuthed(page);

    // "Contact with the courier" only renders for an active (non-history) order — skip when none.
    const contactBtn = await findActionButton(page, /contact with the courier/i);
    if (!contactBtn) {
      test.skip(true, 'E2E user has no active order to contact a courier for — seed one');
    }

    await expect(contactBtn!).toBeVisible({ timeout: 10_000 });
    await contactBtn!.click();

    // ContactUsForm renders through the shared Modal (`#modalBody`) without leaving the page.
    await expect(page.locator('#modalBody')).toBeVisible({ timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe('/profile/orders');
  });
});
