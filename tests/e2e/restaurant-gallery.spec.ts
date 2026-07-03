import { expect, type Page, test } from '@playwright/test';

import { isMobile } from './fixtures/helpers';

/**
 * openFirstRestaurant — navigates to `/restaurants`, opens the first restaurant's detail page and
 * waits for it to load.
 *
 * Skips the test when the OneEntry `restaurants` page is absent (404) or the index renders no cards.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the restaurant detail page is loaded (`section.section_layout h1` visible).
 */
const openFirstRestaurant = async (page: Page): Promise<void> => {
  const res = await page.goto('/restaurants', { waitUntil: 'domcontentloaded' });
  if (res?.status() === 404) {
    test.skip(true, 'OneEntry `restaurants` page is not configured (404)');
  }
  await page.waitForLoadState('networkidle').catch(() => undefined);

  const link = page.locator('a[href^="/restaurants/"]').filter({ visible: true }).first();
  if (!(await link.isVisible({ timeout: 15_000 }).catch(() => false))) {
    test.skip(true, 'no restaurant child pages configured');
  }
  const href = await link.getAttribute('href');
  if (!href) {
    test.skip(true, 'first restaurant card has no href');
    return;
  }

  await page.goto(href, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('section.section_layout h1').first()).toBeVisible({ timeout: 15_000 });
};

test.describe('Restaurant gallery lightbox (/restaurants/<handle>)', () => {
  test('clicking the main gallery photo opens the lightbox and Escape closes it', async ({
    page,
  }) => {
    test.skip(isMobile(page), 'lightbox on desktop only');

    await openFirstRestaurant(page);

    // Desktop gallery: `<div className="hidden md:grid …">`. Tailwind class names contain a `:` colon,
    // so a substring attribute match is more robust than escaping; narrow to the grid that actually
    // holds a Swiper (the mobile slider lives in a separate `md:hidden` div).
    const desktopGallery = page
      .locator('div.hidden[class*="md:grid"]')
      .filter({ has: page.locator('.swiper') })
      .first();
    await expect(desktopGallery).toBeVisible({ timeout: 15_000 });

    // The first Swiper is the main slide; its `onClick` calls `openLightbox`. Clicking the slide
    // (not the `pointer-events-none` image) lets the click bubble to the Swiper's handler.
    const mainSlide = desktopGallery.locator('.swiper-slide').first();
    if ((await mainSlide.count()) === 0) {
      test.skip(true, 'restaurant has no gallery photos');
    }
    await expect(mainSlide).toBeVisible({ timeout: 15_000 });
    await mainSlide.click();

    // `RestaurantLightbox` (yet-another-react-lightbox) is a lazy `dynamic({ ssr:false })` chunk that
    // mounts only on first open, so allow time for the chunk to load. Its portal root is `.yarl__root`.
    const lightbox = page.locator('.yarl__root').first();
    await expect(lightbox).toBeVisible({ timeout: 15_000 });

    // yarl closes on Escape by default; if the root lingers, fall back to the explicit close button.
    await page.keyboard.press('Escape');
    await expect(lightbox)
      .toBeHidden({ timeout: 5_000 })
      .catch(async () => {
        await page
          .locator('.yarl__button[aria-label*="close" i]')
          .first()
          .click()
          .catch(() => undefined);
      });
    await expect(lightbox).toBeHidden({ timeout: 10_000 });
  });
});
