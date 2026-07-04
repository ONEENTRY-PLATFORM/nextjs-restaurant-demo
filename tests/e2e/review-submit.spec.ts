import { expect, type Locator, type Page, test } from '@playwright/test';

import { getTestUserCreds, gotoAndReady, signInAsTestUser } from './fixtures/helpers';

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

  // Data-dependent: the flow under test needs at least one order. Wait for either the empty state
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
 * findReviewButton — expands all order cards, then returns a locator for the first "Leave a review"
 * action button, or `null` when none exists (data-dependent → caller skips).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving to the review button Locator, or `null` when no delivered order exists.
 */
const findReviewButton = async (page: Page): Promise<Locator | null> => {
  await expandAllOrderCards(page);
  const btn = page.getByRole('button', { name: /leave a review/i }).first();
  if ((await btn.count()) === 0) return null;
  return btn;
};

/**
 * findEditableReviewItem — locates the content column of the first `ReviewableItem` that is still
 * editable, i.e. renders an interactive `StarRating` (`role="radiogroup"` with `N star(s)` buttons).
 *
 * A ReviewableItem for a product that already has a review renders its stars as non-interactive
 * `<span>`s (no button), so submitting a *new* review (the POST path under test) is only possible on
 * a not-yet-reviewed row. Each item's `<input placeholder="Review">` shares a parent with its stars,
 * Apply and success message, so the input's parent is a stable single-item scope that survives the
 * post-submit re-render (unlike the stars, which turn into spans on success).
 *
 * @param   {Locator} popup - Locator for the review popup (`#modalBody`).
 * @returns Promise resolving to the content-column Locator of the first editable item, or `null`.
 */
const findEditableReviewItem = async (popup: Locator): Promise<Locator | null> => {
  const inputs = popup.getByPlaceholder(/review/i);
  await expect(inputs.first()).toBeVisible({ timeout: 15_000 });
  const total = await inputs.count();
  for (let i = 0; i < total; i += 1) {
    const col = inputs.nth(i).locator('..');
    if ((await col.getByRole('button', { name: /\d+ stars?/i }).count()) > 0) {
      return col;
    }
  }
  return null;
};

// Serialized: all tests share the same OneEntry test user, and parallel sign-ins of the same account
// can collide on the server-side session (surfacing a spurious "Authentication failed").
test.describe.serial('Submit a review (OrderReviewPopup → ReviewableItem)', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('rates + writes a review and Apply shows the success confirmation', async ({ page }) => {
    await openOrdersAuthed(page);

    // "Leave a review" only renders for a delivered order — skip when the E2E user has none.
    const reviewBtn = await findReviewButton(page);
    if (!reviewBtn) {
      test.skip(true, 'E2E user has no delivered order to review — seed one');
    }

    await expect(reviewBtn!).toBeVisible({ timeout: 10_000 });
    await reviewBtn!.click();

    // OrderReviewPopup mounts its own `#modalBody` carrying the "Leave a review" heading.
    const popup = page.locator('#modalBody');
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup.getByText(/leave a review/i).first()).toBeVisible({ timeout: 10_000 });

    // Reviews are prefilled from the server; only a product without an existing review keeps an
    // interactive StarRating (→ the POST path). Skip (don't fail) when everything is already reviewed.
    const item = await findEditableReviewItem(popup);
    if (!item) {
      test.skip(true, 'all delivered products already reviewed — no editable review row to submit');
    }

    // Rate (click the last, 5-star button of this item) and write the review text.
    await item!.getByRole('button', { name: /5 stars?/i }).click();
    await item!.getByPlaceholder(/review/i).fill('E2E review');

    // Mock the create-review mutation BEFORE clicking Apply. A new review is a POST to the FormData
    // module, whose endpoint is `/api/content/form-data` (SINGULAR — the SDK dir is `forms-data` but
    // the URL is `form-data`); editing an existing one is a PUT to `/form-data/<id>`. Guard on the
    // method so only the POST under test is stubbed and any PUT passes through untouched.
    await page.route(/\/form-data(\/|\?|$)/, async route => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ formData: { id: 987654 } }),
      });
    });

    // Apply (scoped to this item) → the row flips to `existingId !== null && !isEditing`, which renders
    // the "Thanks for your review!" confirmation (`review_submitted_text`).
    await item!.getByRole('button', { name: /apply/i }).click();
    await expect(item!.getByText(/thanks for your review/i)).toBeVisible({ timeout: 15_000 });

    // Submitting a review is an in-popup mutation — it must not navigate away from the dashboard.
    expect(new URL(page.url()).pathname).toBe('/profile/orders');
  });
});
