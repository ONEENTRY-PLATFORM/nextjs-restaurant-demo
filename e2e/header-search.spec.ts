import { expect, type Locator, type Page, test } from '@playwright/test';

import { gotoAndReady } from './fixtures/helpers';

/**
 * visibleSearchInput — picks the currently visible `<input name="quick-search">`.
 *
 * The header renders both desktop and mobile `SearchBar` copies and gates them with
 * `hidden md:block` / `md:hidden`, so two inputs always live in the DOM. Filtering by
 * `:visible` selects the one matching the active viewport.
 *
 * @param   {Page}    page - Playwright page.
 * @returns Locator for the visible search input.
 */
const visibleSearchInput = (page: Page): Locator =>
  page.locator('input[name="quick-search"]:visible').first();

/**
 * closeSearchButton — locates the dropdown's close-X button (rendered only when the panel is open).
 *
 * @param   {Page}    page - Playwright page.
 * @returns Locator for the `CloseSearch` button (aria-label "Close search results").
 */
const closeSearchButton = (page: Page): Locator =>
  page.getByRole('button', { name: /close search results/i });

test.describe('Header search bar', () => {
  test('is visible in the header and is a search input', async ({ page }) => {
    await gotoAndReady(page, '/');
    const input = visibleSearchInput(page);
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'search');
    await expect(input).toHaveAttribute('name', 'quick-search');
  });

  test('typing on a non-listing page opens the results dropdown', async ({ page }) => {
    await gotoAndReady(page, '/');
    const input = visibleSearchInput(page);
    await input.click();
    await input.pressSequentially('a', { delay: 20 });

    // SearchResults renders the CloseSearch button only when its `state` is true,
    // i.e. when the dropdown panel is mounted. That makes it a stable presence marker.
    await expect(closeSearchButton(page)).toBeVisible({ timeout: 10_000 });
  });

  test('Enter submits → navigates to /shop?search=<query>', async ({ page }) => {
    await gotoAndReady(page, '/');
    const input = visibleSearchInput(page);
    await input.click();
    await input.fill('pizza');
    await input.press('Enter');
    // `router.push` is a soft App-Router nav and never fires the document `load` event that
    // `page.waitForURL` waits for by default — `toHaveURL` just polls the URL, which is correct
    // for client-side history updates.
    await expect(page).toHaveURL(/\/shop(?:\?|\/\?).*search=pizza/, { timeout: 15_000 });
  });

  test('on /shop typing mirrors into ?search= after the debounce', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    const input = visibleSearchInput(page);
    await expect(input).toBeVisible();

    // `.fill()` fires one synchronous `input` event that React's controlled-input handler
    // consumes; `pressSequentially` with a small delay can race React 19 batching and end up
    // dropping the final state update, leaving `userTypedRef.current === false` so the
    // debounce->router.replace path never runs.
    await input.click();
    await input.fill('salad');

    // Debounce is 300ms + Next dev re-render budget. `router.replace` is soft-nav, so
    // `toHaveURL` (URL polling) is the correct primitive — `waitForURL` defaults to waiting for
    // `load`, which never fires for history-API updates.
    await expect(page).toHaveURL(/\?(?:.*&)?search=salad(?:&|$)/, { timeout: 20_000 });
  });

  test('on /shop listing the dropdown panel does NOT open', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    const input = visibleSearchInput(page);
    await input.click();
    await input.pressSequentially('anything', { delay: 20 });

    // Wait past the debounce so the URL update / dropdown decision settles.
    await page.waitForTimeout(700);

    await expect(closeSearchButton(page)).toHaveCount(0);
  });

  test('URL ?search= mirrors into the input value', async ({ page }) => {
    await gotoAndReady(page, '/shop?search=banana');
    const input = visibleSearchInput(page);
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('banana');
  });

  test('non-matching query renders "No products found"', async ({ page }) => {
    await gotoAndReady(page, '/');
    const input = visibleSearchInput(page);
    await input.click();

    // Random suffix to defeat any incidental fuzzy match in real catalog data.
    const noise = `zzq_${Math.random().toString(36).slice(2, 10)}`;
    await input.pressSequentially(noise, { delay: 15 });

    await expect(closeSearchButton(page)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/no products found/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('clearing the input closes the dropdown', async ({ page }) => {
    await gotoAndReady(page, '/');
    const input = visibleSearchInput(page);
    await input.click();
    await input.pressSequentially('abc', { delay: 20 });
    await expect(closeSearchButton(page)).toBeVisible({ timeout: 10_000 });

    await input.fill('');
    // `handleChange('')` flips `isSearchActive` to false → SearchResults unmounts.
    await expect(closeSearchButton(page)).toHaveCount(0);
  });
});
