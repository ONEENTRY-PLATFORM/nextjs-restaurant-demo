import { expect, type Page, test } from '@playwright/test';

import { gotoAndReady, isMobile } from './fixtures/helpers';

/**
 * openCategoryFilter — opens the CategoryFilter drawer via the desktop "Open categories" burger.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the drawer slid in.
 */
const openCategoryFilter = async (page: Page): Promise<void> => {
  // The trigger renders twice (desktop `CategoryButton`, mobile `MobileBurgerButton`),
  // toggled via CSS visibility — filter by `visible` so we click the right viewport's copy.
  const trigger = page
    .locator('button[aria-label="Open categories"]')
    .filter({ visible: true })
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const drawer = page.locator('aside').filter({ hasText: 'Category' }).first();
  await expect(drawer).toBeVisible();
  await page.waitForTimeout(550);
};

/**
 * openFilterPopup — opens the FilterBottom sheet via the "Open filters" trigger (works on desktop and mobile).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `#side-menu` slid in.
 */
const openFilterPopup = async (page: Page): Promise<void> => {
  // `FilterButton` is rendered twice in the header (desktop + mobile copy) — pick the visible one.
  const trigger = page
    .locator('button[aria-label="Open filters"]')
    .filter({ visible: true })
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator('#side-menu')).toBeVisible();
  await page.waitForTimeout(550);
};

/**
 * isOnScreen — checks whether an element's bounding box sits inside the current viewport
 * (used because both drawers stay in DOM and only slide via CSS transforms).
 *
 * @param   {Page}   page     - Playwright page.
 * @param   {string} selector - CSS selector for the drawer root.
 * @returns Promise resolving to `true` if any part of the element is within the viewport.
 */
const isOnScreen = async (page: Page, selector: string): Promise<boolean> => {
  return await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return (
      r.left < window.innerWidth &&
      r.right > 0 &&
      r.top < window.innerHeight &&
      r.bottom > 0 &&
      r.width > 0 &&
      r.height > 0
    );
  }, selector);
};

test.describe('CategoryFilter drawer', () => {
  test('opens from the header and shows the category list', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openCategoryFilter(page);

    const drawer = page.locator('aside').filter({ hasText: 'Category' }).first();
    await expect(drawer.getByText('Category', { exact: true })).toBeVisible();

    const categoryLinks = drawer.locator('a[href^="/shop/category/"]');
    await expect(categoryLinks.first()).toBeVisible();
    expect(await categoryLinks.count()).toBeGreaterThan(0);

    await expect(drawer.locator('a[href="/restaurants"]')).toBeVisible();
  });

  test('clicking a category tile navigates to /shop/category/<slug>', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openCategoryFilter(page);

    const drawer = page.locator('aside').filter({ hasText: 'Category' }).first();
    const firstCat = drawer.locator('a[href^="/shop/category/"]').first();
    const href = await firstCat.getAttribute('href');
    expect(href).toMatch(/^\/shop\/category\/[^/]+$/);

    await firstCat.click();
    await page.waitForURL(/\/shop\/category\/[^/]+$/);
    expect(new URL(page.url()).pathname).toBe(href);
  });

  test('BOOKING TABLE navigates to /restaurants', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openCategoryFilter(page);

    const drawer = page.locator('aside').filter({ hasText: 'Category' }).first();
    const booking = drawer.locator('a[href="/restaurants"]');
    await expect(booking).toBeVisible();

    await booking.click();
    await page.waitForURL(/\/restaurants$/);
  });

  test('clicking the backdrop closes the drawer', async ({ page }) => {
    // On mobile the drawer is `w-full` and covers the backdrop entirely (nothing to click).
    if (isMobile(page)) test.skip();

    await gotoAndReady(page, '/');
    await openCategoryFilter(page);

    // Multiple backdrops with `fixed.inset-0` live in DOM (CategoryFilter + FilterBottom);
    // when closed they keep `opacity-0 pointer-events-none`. Pick the currently active one.
    const backdrop = page
      .locator('div[aria-hidden="true"].fixed.inset-0.pointer-events-auto')
      .first();
    await expect(backdrop).toBeVisible();
    // The CategoryFilter aside occupies the left 400px on `md+`; click well to the right of it.
    await backdrop.click({ position: { x: 800, y: 100 } });

    await page.waitForTimeout(600);
    const drawerSelector = 'aside';
    const visible = await page.evaluate(sel => {
      const list = document.querySelectorAll(sel);
      for (const el of Array.from(list)) {
        if (!el.textContent?.includes('Category')) continue;
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.left >= 0 && r.right <= window.innerWidth + 1 && r.width > 0) return true;
      }
      return false;
    }, drawerSelector);
    expect(visible).toBeFalsy();
  });
});

test.describe('FilterBottom popup', () => {
  test('opens from the header and shows all sections', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openFilterPopup(page);

    const sheet = page.locator('#side-menu');
    await expect(sheet.getByText('Filter', { exact: true })).toBeVisible();
    // OE dict in this project renames `order_waiting_time` to "Cooking time".
    await expect(sheet.getByText(/cooking time|order waiting time/i)).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Under 30 mins' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Under 60 mins' })).toBeVisible();
    await expect(sheet.getByText(/^Price/)).toBeVisible();
    await expect(sheet.getByRole('button', { name: /apply/i })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /clear all filters/i })).toBeVisible();
  });

  test('Apply with waiting time → /shop?cooking_time_max=30', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openFilterPopup(page);

    const sheet = page.locator('#side-menu');
    const chip = sheet.getByRole('button', { name: 'Under 30 mins' });
    await chip.click();
    await expect(chip).toHaveClass(/bg-brand/);

    await sheet.getByRole('button', { name: /apply/i }).click();

    await page.waitForURL(u => u.searchParams.get('cooking_time_max') === '30');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/shop');
    expect(url.searchParams.get('cooking_time_max')).toBe('30');
    // The close animation is 500ms; poll instead of asserting immediately.
    await expect.poll(() => isOnScreen(page, '#side-menu'), { timeout: 3_000 }).toBeFalsy();
  });

  test('Apply with min/max price → /shop?minPrice=&maxPrice=', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openFilterPopup(page);

    const sheet = page.locator('#side-menu');
    await sheet.getByLabel(/from price/i).fill('5');
    await sheet.getByLabel(/under price/i).fill('50');

    await sheet.getByRole('button', { name: /apply/i }).click();

    await page.waitForURL(u => u.searchParams.get('minPrice') === '5');
    const url = new URL(page.url());
    expect(url.searchParams.get('minPrice')).toBe('5');
    expect(url.searchParams.get('maxPrice')).toBe('50');
    expect(url.pathname).toBe('/shop');
  });

  test('Clear all filters resets local state and clears the URL', async ({ page }) => {
    await gotoAndReady(page, '/shop?cooking_time_max=30&minPrice=5&maxPrice=50');
    await openFilterPopup(page);

    const sheet = page.locator('#side-menu');
    await expect(sheet.getByRole('button', { name: 'Under 30 mins' })).toHaveClass(/bg-brand/);
    await expect(sheet.getByLabel(/from price/i)).toHaveValue('5');
    await expect(sheet.getByLabel(/under price/i)).toHaveValue('50');

    await sheet.getByRole('button', { name: /clear all filters/i }).click();

    await expect(sheet.getByRole('button', { name: 'Under 30 mins' })).not.toHaveClass(/bg-brand/);
    await expect(sheet.getByLabel(/from price/i)).toHaveValue('');
    await expect(sheet.getByLabel(/under price/i)).toHaveValue('');

    await sheet.getByRole('button', { name: /apply/i }).click();
    await page.waitForURL(
      u => !u.searchParams.has('cooking_time_max') && !u.searchParams.has('minPrice')
    );
    const url = new URL(page.url());
    expect(url.searchParams.has('cooking_time_max')).toBeFalsy();
    expect(url.searchParams.has('minPrice')).toBeFalsy();
    expect(url.searchParams.has('maxPrice')).toBeFalsy();
  });

  test('clicking waiting time again deselects it', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openFilterPopup(page);

    const sheet = page.locator('#side-menu');
    const chip = sheet.getByRole('button', { name: 'Under 60 mins' });
    await chip.click();
    await expect(chip).toHaveClass(/bg-brand/);
    await chip.click();
    await expect(chip).not.toHaveClass(/bg-brand/);
  });

  test('Preferences: chip activates, clicking again deselects it', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openFilterPopup(page);

    const sheet = page.locator('#side-menu');
    const prefTitle = sheet.locator('p.filter_title', { hasText: 'Preferences' });
    if ((await prefTitle.count()) === 0) {
      test.skip(true, 'Filter options (Preferences) not configured in OneEntry');
    }
    await expect(prefTitle).toBeVisible();

    // First chip in the Preferences block (skips WAITING_TIME chips that come above).
    const firstPrefChip = prefTitle
      .locator('xpath=following-sibling::div//button[contains(@class, "filter_item")]')
      .first();
    await expect(firstPrefChip).toBeVisible();

    await firstPrefChip.click();
    await expect(firstPrefChip).toHaveClass(/bg-brand/);

    await firstPrefChip.click();
    await expect(firstPrefChip).not.toHaveClass(/bg-brand/);
  });

  test('Apply with Preferences → /shop?filter=<value>', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openFilterPopup(page);

    const sheet = page.locator('#side-menu');
    const prefTitle = sheet.locator('p.filter_title', { hasText: 'Preferences' });
    if ((await prefTitle.count()) === 0) {
      test.skip(true, 'Filter options (Preferences) not configured in OneEntry');
    }

    const firstPrefChip = prefTitle
      .locator('xpath=following-sibling::div//button[contains(@class, "filter_item")]')
      .first();
    await expect(firstPrefChip).toBeVisible();
    await firstPrefChip.click();
    await expect(firstPrefChip).toHaveClass(/bg-brand/);

    await sheet.getByRole('button', { name: /apply/i }).click();

    await page.waitForURL(u => !!u.searchParams.get('filter'));
    const url = new URL(page.url());
    expect(url.pathname).toBe('/shop');
    const filterValue = url.searchParams.get('filter');
    expect(filterValue).toBeTruthy();
    expect(filterValue).not.toContain(' ');
    // The close animation is 500ms; poll instead of asserting immediately.
    await expect.poll(() => isOnScreen(page, '#side-menu'), { timeout: 3_000 }).toBeFalsy();
  });

  test('Close X dismisses the popup (desktop)', async ({ page }) => {
    if (isMobile(page)) test.skip();

    await gotoAndReady(page, '/');
    await openFilterPopup(page);

    await page.locator('#side-menu button[aria-label="Close"]').click();
    await page.waitForTimeout(600);
    // The close animation is 500ms; poll instead of asserting immediately.
    await expect.poll(() => isOnScreen(page, '#side-menu'), { timeout: 3_000 }).toBeFalsy();
  });
});
