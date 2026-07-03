import { expect, test } from '@playwright/test';

import { gotoAndReady, openFirstProduct } from './fixtures/helpers';

test.describe('Product page recommendation blocks (/shop/product/<id>)', () => {
  test('Related/Featured section (if present) renders a grid with product cards', async ({
    page,
  }) => {
    await openFirstProduct(page);

    // `RelatedItems` renders `<h3 class="title_name">` = `t('featured_objects', 'Featured objects')`
    // only when related products exist. Detect via count() (DOM presence, no reveal-race) and skip
    // gracefully when the product has no related items.
    const headings = page.getByRole('heading', { name: /featured objects/i });
    if ((await headings.count()) === 0) {
      test.skip(true, 'product has no Related/Featured section');
    }
    const heading = headings.first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Scope to the section that owns this heading (the nearest `<section>` ancestor), then assert its
    // `.menu_items` grid holds at least one `.menu_item` card.
    const grid = heading.locator('xpath=ancestor::section[1]').locator('.menu_items').first();
    await expect(grid).toBeVisible({ timeout: 15_000 });
    expect(await grid.locator('.menu_item').count()).toBeGreaterThanOrEqual(1);
  });

  test('Recently viewed section (if present on a 2nd product) renders a grid with cards', async ({
    page,
  }) => {
    // Visit one product first to seed the "recently viewed" history, then open a different product.
    await openFirstProduct(page);

    await gotoAndReady(page, '/shop');
    const secondCardLink = page
      .locator('.menu_item')
      .nth(1)
      .locator('a[href^="/shop/product/"]')
      .first();
    if ((await secondCardLink.count()) === 0) {
      test.skip(true, 'catalog has fewer than 2 products');
    }
    const href = await secondCardLink.getAttribute('href');
    if (!href) {
      test.skip(true, 'second product card has no href');
      return;
    }
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.locator('.shop_section')).toBeVisible({ timeout: 20_000 });

    // `RecommendationsSection` (kind="recentlyViewed") uses `getRecommendations` with
    // `fallbackToCatalog: true`, so the block usually renders even anonymously; still treat it as
    // conditional (skip if the heading is absent — e.g. block disabled / fallback off).
    const headings = page.getByRole('heading', { name: /recently viewed/i });
    if ((await headings.count()) === 0) {
      test.skip(true, 'no "Recently viewed" section (recommendation block not configured)');
    }
    const heading = headings.first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const grid = heading.locator('xpath=ancestor::section[1]').locator('.menu_items').first();
    await expect(grid).toBeVisible({ timeout: 15_000 });
    expect(await grid.locator('.menu_item').count()).toBeGreaterThanOrEqual(1);
  });

  test('Buy-together (ProductsGroup) section (if present) shows the Apply button', async ({
    page,
  }) => {
    await openFirstProduct(page);

    // `ProductsGroup` renders only when the product's `blocks` include `multiply_items_offer`. Its
    // heading is `<h2 class="title_name">` (CMS `together_title`) and each `GroupCard` renders an
    // Apply/Cancel toggle (`t('apply_text', 'Apply')`). The CMS title may not literally say "together",
    // so treat the Apply button as the reliable presence signal and combine both.
    const togetherHeading = page.locator('h2.title_name').filter({ hasText: /together/i });
    const applyBtn = page.getByRole('button', { name: /apply/i });
    const present = (await togetherHeading.count()) > 0 || (await applyBtn.count()) > 0;
    test.skip(!present, 'product has no Buy-together (ProductsGroup) section');

    await expect(applyBtn.first()).toBeVisible({ timeout: 15_000 });
  });
});
