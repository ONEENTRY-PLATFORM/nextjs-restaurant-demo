import { expect, test } from '@playwright/test';

import { gotoAndReady } from './fixtures/helpers';

test.describe('CategoriesScroller (preferences chips)', () => {
  test('scroller renders chips on the home page', async ({ page }) => {
    await gotoAndReady(page, '/');

    const scroller = page.locator('#menuItems');
    await expect(scroller).toBeVisible({ timeout: 15_000 });

    const chips = scroller.locator('li.list_item a.list_link');
    await expect(chips.first()).toBeVisible();
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);

    const firstHref = await chips.first().getAttribute('href');
    expect(firstHref).toMatch(/^\/shop(\?.*preferences=)/);
  });

  test('clicking a chip navigates to /shop?preferences=<value>', async ({ page }) => {
    await gotoAndReady(page, '/');

    const chip = page.locator('#menuItems li.list_item a.list_link').first();
    await expect(chip).toBeVisible();
    const href = await chip.getAttribute('href');
    expect(href).toMatch(/^\/shop\?.*preferences=/);

    await chip.click();
    await page.waitForURL(/\/shop\?.*preferences=/);

    const url = new URL(page.url());
    expect(url.pathname).toBe('/shop');
    expect(url.searchParams.get('preferences')).toBeTruthy();
  });

  test('on /shop the active chip is highlighted and clicking it clears the filter', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');

    const firstChip = page.locator('#menuItems li.list_item a.list_link').first();
    const chipText = (await firstChip.innerText()).trim();
    const href = await firstChip.getAttribute('href');
    const rawValue = href?.match(/preferences=([^&]+)/)?.[1];
    expect(rawValue, 'preferences value in href').toBeTruthy();
    const value = decodeURIComponent((rawValue ?? '').split(',')[0] ?? '');
    expect(value).toBeTruthy();

    await firstChip.click();
    await page.waitForURL(/\/shop\?.*preferences=/);

    const activeChip = page
      .locator('#menuItems li.list_item a.list_link', { hasText: chipText })
      .first();
    await expect(activeChip).toBeVisible();
    await expect(activeChip).toHaveClass(/bg-brand/);

    const activeLi = page.locator('#menuItems li.list_item', { hasText: chipText }).first();
    await expect(activeLi).toHaveClass(/border-brand/);

    const toggleHref = await activeChip.getAttribute('href');
    expect(toggleHref).not.toContain('preferences=' + encodeURIComponent(value));

    await activeChip.click();
    await page.waitForURL(u => !u.searchParams.has('preferences'));
    expect(new URL(page.url()).searchParams.has('preferences')).toBeFalsy();
  });

  test('two chips combine into preferences=A,B separated by a comma', async ({ page }) => {
    await gotoAndReady(page, '/');

    const chips = page.locator('#menuItems li.list_item a.list_link');
    const total = await chips.count();
    if (total < 2) test.skip();

    await chips.nth(0).click();
    await page.waitForURL(/\/shop\?.*preferences=/);
    const firstValue = new URL(page.url()).searchParams.get('preferences') ?? '';
    expect(firstValue).not.toContain(',');

    const remaining = page
      .locator('#menuItems li.list_item:not(.border-brand) a.list_link')
      .first();
    await expect(remaining).toBeVisible();
    await remaining.click();

    await page.waitForURL(u => (u.searchParams.get('preferences') ?? '').includes(','));
    const combined = new URL(page.url()).searchParams.get('preferences') ?? '';
    const values = combined.split(',').filter(Boolean);
    expect(values.length).toBe(2);
    expect(values).toContain(firstValue);
  });

  test('applying a filter does not break the catalog: grid is rendered', async ({ page }) => {
    await gotoAndReady(page, '/');

    const chip = page.locator('#menuItems li.list_item a.list_link').first();
    await chip.click();
    await page.waitForURL(/\/shop\?.*preferences=/);

    await page.waitForLoadState('networkidle').catch(() => undefined);

    const grid = page.locator('.menu_items');
    const notFound = page.getByText(/no products|not found|nothing found/i).first();

    const ok = await Promise.race([
      grid.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'grid' as const),
      notFound.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'empty' as const),
    ]).catch(() => null);

    expect(ok, 'either grid or empty-state must render').not.toBeNull();
  });

  test('scroller is horizontally scrollable (overflow-x-auto)', async ({ page }) => {
    await gotoAndReady(page, '/');

    const scroller = page.locator('#menuItems');
    await expect(scroller).toBeVisible();

    const metrics = await scroller.evaluate((el: HTMLElement) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
    }));

    if (metrics.scrollWidth <= metrics.clientWidth + 4) {
      test.info().annotations.push({
        type: 'note',
        description: `scroller fits in viewport (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`,
      });
      test.skip();
    }

    await scroller.evaluate((el: HTMLElement) => {
      el.scrollLeft = 200;
    });

    const after = await scroller.evaluate((el: HTMLElement) => el.scrollLeft);
    expect(after).toBeGreaterThan(0);
  });
});
