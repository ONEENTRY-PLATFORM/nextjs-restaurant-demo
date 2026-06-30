import { expect, type Page, test } from '@playwright/test';

/**
 * gotoRestaurantsOrSkip — navigates to `/restaurants` and skips the test when the OneEntry
 * `restaurants` page is absent (404).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `/restaurants` has loaded; otherwise the test is skipped.
 */
const gotoRestaurantsOrSkip = async (page: Page): Promise<void> => {
  const res = await page.goto('/restaurants', { waitUntil: 'domcontentloaded' });
  if (res?.status() === 404) {
    test.skip(
      true,
      'OneEntry `restaurants` page is not configured (404)'
    );
  }
  await page.waitForLoadState('networkidle').catch(() => undefined);
};

/**
 * firstRestaurantHref — reads the href of the first restaurant card's "More about restaurant" link.
 *
 * Restaurant cards link to `/restaurants/<pageUrl>` (one CTA per card). Returns `null` when the index
 * renders no cards so callers can skip gracefully.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving to the detail href, or `null` when no restaurant is configured.
 */
const firstRestaurantHref = async (page: Page): Promise<string | null> => {
  const link = page.locator('a[href^="/restaurants/"]').filter({ visible: true }).first();
  if (!(await link.isVisible({ timeout: 15_000 }).catch(() => false))) return null;
  return link.getAttribute('href');
};

test.describe('Restaurants index (/restaurants)', () => {
  test('renders the title and at least one restaurant card', async ({ page }) => {
    await gotoRestaurantsOrSkip(page);

    const title = page.locator('section.section_layout h1').first();
    await expect(title).toBeVisible({ timeout: 15_000 });
    await expect(title).not.toBeEmpty();

    const href = await firstRestaurantHref(page);
    test.skip(href === null, 'no restaurant child pages configured');

    const cards = page.locator('a[href^="/restaurants/"]');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(page.getByRole('link', { name: /more about restaurant/i }).first()).toBeVisible();
  });

  test('"More about restaurant" navigates to the restaurant detail page', async ({ page }) => {
    await gotoRestaurantsOrSkip(page);
    const href = await firstRestaurantHref(page);
    test.skip(href === null, 'no restaurant child pages configured');

    expect(href).toMatch(/^\/restaurants\/[^/?#]+$/);
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    await expect(page.locator('section.section_layout h1').first()).toBeVisible({
      timeout: 15_000,
    });
    expect(new URL(page.url()).pathname).toBe(href);
  });

  test('unknown restaurant handle returns 404', async ({ page }) => {
    const res = await page.goto('/restaurants/__no_such_restaurant_xyz__', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBe(404);
  });
});

test.describe('Restaurant detail (/restaurants/<handle>)', () => {
  /**
   * gotoFirstRestaurant — opens `/restaurants`, then navigates to the first restaurant's detail page
   * (skips the test when the index has no cards).
   *
   * @param   {Page}   page - Playwright page.
   * @returns Promise resolving once the detail page is loaded.
   */
  const gotoFirstRestaurant = async (page: Page): Promise<void> => {
    await gotoRestaurantsOrSkip(page);
    const href = await firstRestaurantHref(page);
    test.skip(href === null, 'no restaurant child pages configured');
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.locator('section.section_layout h1').first()).toBeVisible({
      timeout: 15_000,
    });
  };

  test('shows the Contacts block and a back link to the index', async ({ page }) => {
    await gotoFirstRestaurant(page);

    // The Contacts heading is rendered unconditionally on every restaurant detail page.
    await expect(page.getByText(/^contacts$/i).first()).toBeVisible();

    const back = page.locator('section.section_layout a[href="/restaurants"]').first();
    await expect(back).toBeVisible();
    await back.click();
    await page.waitForURL(/\/restaurants$/);
  });

  test('"Book a table" opens the reservation popup with the booking form', async ({ page }) => {
    await gotoFirstRestaurant(page);

    // The CTA is rendered twice (desktop comforts-row copy `hidden md:flex`, mobile copy `md:hidden`);
    // pick the one visible in the active viewport. The label is dictionary-driven (`book_button`):
    // OneEntry serves "Book", the compiled fallback is "Book a table" — match either.
    const book = page
      .getByRole('button', { name: /^book( a table)?$/i })
      .filter({ visible: true })
      .first();
    await expect(book).toBeVisible({ timeout: 15_000 });
    await book.click();

    await expect(page.locator('#modalBody').first()).toBeVisible({ timeout: 10_000 });
    // The reservation form pre-fills the restaurant from the CTA's `action`; the `#name` field marks
    // the booking form is mounted.
    await expect(page.locator('#name')).toBeVisible({ timeout: 15_000 });
  });
});
