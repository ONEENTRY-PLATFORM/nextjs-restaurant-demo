import { expect, type Locator, type Page, test } from '@playwright/test';

import { firstProductCard, gotoAndReady } from './fixtures/helpers';

/**
 * visibleSearchInput — picks the currently visible `input#searchInput`.
 *
 * The header renders both desktop and mobile `SearchBar` copies (gated with `hidden md:block` /
 * `md:hidden`), so two inputs sharing `id="searchInput"` always live in the DOM. Filtering by
 * `:visible` selects the one matching the active viewport.
 *
 * @param   {Page}    page - Playwright page.
 * @returns Locator for the visible search input.
 */
const visibleSearchInput = (page: Page): Locator =>
  page.locator('input#searchInput:visible').first();

/**
 * closeSearchButton — locates the dropdown's close-X button (rendered only when the panel is open).
 *
 * @param   {Page}    page - Playwright page.
 * @returns Locator for the `CloseSearch` button (aria-label "Close search results").
 */
const closeSearchButton = (page: Page): Locator =>
  page.getByRole('button', { name: /close search results/i });

/**
 * searchPanel — locates the open results dropdown panel on a non-listing route.
 *
 * The panel is the `bg-ink/80 backdrop-blur-card` container; it is disambiguated from other
 * blur-card surfaces (e.g. the input itself) by requiring the close button inside it, which
 * `SearchResults` renders only while its `state` is `true`.
 *
 * @param   {Page}    page - Playwright page.
 * @returns Locator for the visible search-results dropdown panel.
 */
const searchPanel = (page: Page): Locator =>
  page
    .locator('div.backdrop-blur-card')
    .filter({ has: closeSearchButton(page) })
    .first();

/**
 * firstProductWord — reads the first catalog card title on `/shop` and returns its first word.
 *
 * Used to feed the dropdown a query guaranteed to match at least one product. Falls back to the
 * full trimmed title when the leading token is too short to be a meaningful query.
 *
 * @param   {Page}    page - Playwright page.
 * @returns Promise resolving to a real product-name token to search for.
 */
const firstProductWord = async (page: Page): Promise<string> => {
  await gotoAndReady(page, '/shop');
  const title = firstProductCard(page).locator('.menu_item-title').first();
  await expect(title).toBeVisible({ timeout: 20_000 });
  const text = (await title.textContent())?.trim() ?? '';
  const word = text.split(/\s+/)[0] ?? '';
  return word.length >= 2 ? word : text;
};

/**
 * typeQuery — focuses the visible header search input and fills it with a query.
 *
 * `.fill()` fires a single synchronous `input` event that React's controlled `onChange` consumes,
 * avoiding the per-keystroke React 19 batching races that `pressSequentially` can hit.
 *
 * @param   {Page}    page - Playwright page.
 * @param   {string}  term - Query text to type.
 * @returns Promise resolving once the input holds the query.
 */
const typeQuery = async (page: Page, term: string): Promise<void> => {
  const input = visibleSearchInput(page);
  await input.click();
  await input.fill(term);
};

test.describe('Header search dropdown (non-shop routes)', () => {
  test('typing a real product word on the home page opens the dropdown with product links', async ({
    page,
  }) => {
    const word = await firstProductWord(page);
    await gotoAndReady(page, '/');
    await typeQuery(page, word);

    const panel = searchPanel(page);
    await expect(panel).toBeVisible({ timeout: 15_000 });
    // Debounce (300ms) + SDK fetch: the first product-result link is the stable "has results" marker.
    await expect(panel.locator('a[href^="/shop/product/"]').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('clicking a result row navigates to the product page', async ({ page }) => {
    const word = await firstProductWord(page);
    await gotoAndReady(page, '/');
    await typeQuery(page, word);

    const panel = searchPanel(page);
    await expect(panel).toBeVisible({ timeout: 15_000 });
    const firstResult = panel.locator('a[href^="/shop/product/"]').first();
    await expect(firstResult).toBeVisible({ timeout: 15_000 });

    await firstResult.click();

    // `<Link>` is a soft App-Router nav (no document `load`), so poll the URL and the page marker.
    await expect(page).toHaveURL(/\/shop\/product\//, { timeout: 15_000 });
    await expect(page.locator('section.shop_section')).toBeVisible({ timeout: 20_000 });
  });

  test('a non-matching query renders "No products found" in the dropdown', async ({ page }) => {
    await gotoAndReady(page, '/');
    await typeQuery(page, 'zzzqqqxyz123');

    // The close button confirms the panel is mounted; then the empty-state copy resolves.
    await expect(closeSearchButton(page)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/no products found/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('"Open all results in shop" jumps to /shop?search=', async ({ page }) => {
    const word = await firstProductWord(page);
    await gotoAndReady(page, '/');
    await typeQuery(page, word);

    const panel = searchPanel(page);
    await expect(panel).toBeVisible({ timeout: 15_000 });
    // The button renders only when there are results (`hasResults && onOpenInShop`); wait for a row first.
    await expect(panel.locator('a[href^="/shop/product/"]').first()).toBeVisible({
      timeout: 15_000,
    });

    const openAllBtn = panel.locator('button[aria-label="Open all results in shop"]');
    await expect(openAllBtn).toBeVisible({ timeout: 10_000 });
    await openAllBtn.click();

    // `goToShopWithQuery` → `router.push('/shop?search=<query>')` (soft nav) → poll the URL.
    await expect(page).toHaveURL(/\/shop\?.*search=/, { timeout: 15_000 });
  });
});
