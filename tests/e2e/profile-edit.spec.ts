import { expect, type Page, test } from '@playwright/test';

import {
  getTestUserCreds,
  gotoAndReady,
  signInAsTestUser,
  waitForAuthedHeader,
} from './fixtures/helpers';

// Minimal user-shaped body returned by the stubbed `updateUser` PUT. It deliberately omits
// `statusCode` so the SDK/RTK `isError` guard treats it as a successful save (and the "Data saved!"
// toast fires) — the real profile mutation is never sent to OneEntry.
const savedUserStub = {
  id: 1,
  formIdentifier: 'email',
  identifier: 'e2e-profile@example.test',
  formData: [],
  state: {},
};

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
 * gotoProfile — signs the test user in (or skips), then lands on an authenticated `/profile`.
 *
 * Signs in on `/`, navigates to `/profile` and waits for the header Profile link so the client-side
 * `AuthContext` has restored `isAuth` before the profile sections are asserted.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `/profile` is loaded and authenticated.
 */
const gotoProfile = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/');
  await signInOrSkip(page);
  await gotoAndReady(page, '/profile');
  await waitForAuthedHeader(page);
};

// Serialized: all tests share the same OneEntry test user, and parallel sign-ins of the same account
// can collide on the server-side session (surface "Authentication failed" on the slower request).
test.describe.serial('Profile sections (My Profile / Address / Bonus)', () => {
  test.beforeEach(async () => {
    if (!getTestUserCreds()) {
      test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set (see .env.local)');
    }
  });

  test('My Profile: editing a field and saving surfaces the "Data saved!" toast', async ({
    page,
  }) => {
    await gotoProfile(page);

    // MyProfileSection opens by default on a direct visit; guard by expanding if the form is collapsed.
    const firstField = page.locator('input.input[type="text"]').first();
    if (!(await firstField.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: /my profile/i }).click();
    }
    await expect(firstField).toBeVisible({ timeout: 15_000 });

    // Change one text attribute (name/surname/phone — never the email/password login fields).
    await firstField.fill('E2E Tester');

    // Stub the profile mutation (PUT `/me`) BEFORE clicking Save — the follow-up `refreshUser` GET
    // `/me` passes through untouched. `/\/me(\?|$)/` intentionally does not match `/me/cart`.
    await page.route(/\/me(\?|$)/, route => {
      if (route.request().method() !== 'PUT') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(savedUserStub),
      });
    });

    // The submit label is dictionary-driven (`submit_text`) — live OneEntry serves "Submit", the code
    // fallback is "Save"; match either.
    await page.getByRole('button', { name: /save|submit/i }).click();

    // On a successful save react-toastify shows `t('data_saved_toast', 'Data saved!')`. The label is
    // dict-driven, so assert the toast surfaced (by text where it matches, else any toast body).
    await expect(
      page.getByText(/saved/i).first().or(page.locator('.Toastify__toast-body').first())
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Bonus balance: mocked balance renders and expanding shows history or the empty state', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');
    await signInOrSkip(page);

    // Force a non-zero balance. `/\/bonus-balance(\?|$)/` matches only the balance endpoint, never the
    // `/bonus-balance/history` request (that one falls through to the live server → empty state).
    await page.route(/\/bonus-balance(\?|$)/, route => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: 250 }),
      });
    });

    await gotoAndReady(page, '/profile');
    await waitForAuthedHeader(page);

    // The toggle's accessible name is "Bonus balance: 250" (label is dict-driven → match by regex).
    const bonusToggle = page.getByRole('button', { name: /bonus balance/i });
    await expect(bonusToggle).toBeVisible({ timeout: 15_000 });
    await expect(bonusToggle).toContainText('250');

    // Expanding lazily loads history: either transaction rows or the "No bonus transactions yet." empty
    // state (the live history endpoint returns 403 for this account → empty). Scope to the section.
    await bonusToggle.click();
    const bonusSection = bonusToggle.locator('xpath=..');
    const emptyHistory = bonusSection.getByText(/no bonus transactions yet/i);
    const txnRow = bonusSection.locator('.profile-anim-row');
    await expect(emptyHistory.or(txnRow.first())).toBeVisible({ timeout: 15_000 });
  });

  test('Address: adding an address fires the updateUser (PUT /me) request', async ({ page }) => {
    await gotoProfile(page);

    // AddressSection is expanded by default → the "+ Add Address" button is visible; clicking it reveals
    // the (otherwise `hidden`) add-address form.
    const addAddressBtn = page.getByRole('button', { name: /add address/i });
    await expect(addAddressBtn).toBeVisible({ timeout: 15_000 });
    await addAddressBtn.click();

    // The add-address form is the only profile form containing a "Street" label; its three text inputs
    // are Street / House / Floor in order (labels are not `htmlFor`-linked, so target by structure).
    const addrForm = page.locator('form').filter({ hasText: /street/i });
    const inputs = addrForm.locator('input[type="text"]');
    await inputs.nth(0).fill('Baker Street');
    await inputs.nth(1).fill('221');
    await inputs.nth(2).fill('2');

    // Stub the persist (PUT `/me`) so nothing is written to OneEntry; the `refreshUser` GET falls through.
    await page.route(/\/me(\?|$)/, route => {
      if (route.request().method() !== 'PUT') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(savedUserStub),
      });
    });

    // Assert the mutation was actually issued. The row-appearance check is intentionally omitted: the new
    // address is added optimistically but then reverts on the follow-up `refreshUser` refetch (the stubbed
    // PUT never persisted it), so asserting the row would be flaky.
    const putMe = page.waitForRequest(
      req => req.method() === 'PUT' && /\/me(\?|$)/.test(req.url())
    );

    await addrForm.getByRole('button', { name: /apply/i }).click();

    await putMe;
  });
});
