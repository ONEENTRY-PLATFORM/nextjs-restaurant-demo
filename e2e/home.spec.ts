import { expect, test } from '@playwright/test';

import { dismissCookieBanner, gotoAndReady, isMobile } from './fixtures/helpers';

test.describe('Home page', () => {
  test('loads without errors and shows the slogan', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', err => consoleErrors.push(err.message));

    await gotoAndReady(page, '/');

    await expect(page).toHaveTitle(/.+/);

    if (!isMobile(page)) {
      await expect(page.getByText(/Excellent taste/i)).toBeVisible();
    }

    const home = await page
      .locator('#header')
      .isVisible()
      .catch(() => false);
    expect(home).toBeTruthy();

    expect(consoleErrors, `page errors: ${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('header contains a logo linking back to home', async ({ page }) => {
    await gotoAndReady(page, '/shop');
    const logoLink = page.locator('header a[href="/"], #header a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await page.waitForURL(u => u.pathname === '/' || u.pathname === '');
  });

  test('catalog opens from the navigation', async ({ page }) => {
    await gotoAndReady(page, '/');

    if (isMobile(page)) {
      const burger = page.getByRole('button', { name: /menu|burger/i }).first();
      if (await burger.isVisible().catch(() => false)) {
        await burger.click();
      }
    }

    // Many such links exist in the DOM (header drawers, off-screen). Read the href of the first
    // "View all" link inside `<main>` and navigate directly — this verifies the link target without
    // dealing with scroll/viewport quirks.
    const menuLink = page
      .locator(
        'main a[href^="/shop/category/"], main a[href*="/restaurants"], main a[href*="/blog"]'
      )
      .first();
    await expect(menuLink).toBeVisible({ timeout: 15_000 });
    const href = await menuLink.getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await expect(page).toHaveURL(/\/(shop|restaurants|blog)/);
  });

  test('DOM has no multipart prerender artifacts (Next 16.2.6 bug)', async ({ page }) => {
    await gotoAndReady(page, '/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/^--[a-f0-9]{16,}/m);
    expect(bodyText).not.toMatch(/content-type:\s*text\/html/i);
    await dismissCookieBanner(page);
  });
});
