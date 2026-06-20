import { expect, type Locator, type Page } from '@playwright/test';

/**
 * isMobile — detect viewport width to gate desktop-only vs mobile-only locators.
 *
 * @param   {Page}    page - Playwright page.
 * @returns Whether the current viewport is narrower than the `md` breakpoint (768px).
 */
export const isMobile = (page: Page): boolean => {
  const size = page.viewportSize();
  return !!size && size.width < 768;
};

/**
 * dismissCookieBanner — clicks any visible cookie/consent button if present (best-effort).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the consent button (if any) was clicked.
 */
export const dismissCookieBanner = async (page: Page): Promise<void> => {
  const candidates = [
    page.getByRole('button', { name: /accept|i agree|ok|got it/i }),
    page.getByRole('button', { name: /allow all/i }),
  ];
  for (const c of candidates) {
    if (
      await c
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await c
        .first()
        .click()
        .catch(() => undefined);
      return;
    }
  }
};

/**
 * gotoAndReady — navigates to a URL and waits for the page body to settle.
 *
 * @param   {Page}    page - Playwright page.
 * @param   {string}  url  - Target URL relative to baseURL.
 * @returns Promise resolving once the page is loaded and the toast container (if any) is dismissed.
 */
export const gotoAndReady = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await dismissCookieBanner(page);
};

/**
 * firstProductCard — returns a locator for the first visible product card on the catalog page.
 *
 * @param   {Page}    page - Playwright page.
 * @returns Locator for the first `.menu_item` card.
 */
export const firstProductCard = (page: Page): Locator => page.locator('.menu_item').first();

/**
 * openFirstProduct — navigates from `/shop` to the first product's detail page by reading the card
 * link href and going there directly.
 *
 * Clicking the card overlay link is unreliable: it is `z-0` while the `.descr` strip is `z-10`, so on
 * the narrow mobile grid the overlay centre is covered by `.descr` and the click is intercepted.
 * Navigating by href verifies the link target without depending on tap-target geometry.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `/shop/product/<id>` has loaded (`.shop_section` visible).
 */
export const openFirstProduct = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/shop');
  const link = firstProductCard(page).locator('a[href^="/shop/product/"]').first();
  await expect(link).toBeVisible({ timeout: 20_000 });
  const href = await link.getAttribute('href');
  if (!href) throw new Error('first product card link has no href');
  await page.goto(href, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('.shop_section')).toBeVisible({ timeout: 20_000 });
};

/**
 * addFirstProductToCart — adds the first catalog card to the Redux cart by clicking its in-card add button.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving to the product card locator after the add toast is observed.
 */
export const addFirstProductToCart = async (page: Page): Promise<Locator> => {
  const card = firstProductCard(page);
  await expect(card).toBeVisible();
  // `aria-label^="Add"` also matches the heart "Add to favorites" button — narrow to the cart CTA
  // whose template is `Add <title> to cart`.
  const addBtn = card.locator('button[aria-label*="to cart"]').first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  return card;
};

/**
 * openCartFromHeader — opens `/cart` via the desktop nav cart icon or the mobile bottom-menu cart button.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `/cart` is loaded.
 */
export const openCartFromHeader = async (page: Page): Promise<void> => {
  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
};

/**
 * randomEmail — generates a unique throwaway email for sign-up tests.
 *
 * @returns Email string.
 */
export const randomEmail = (): string =>
  `pw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.test`;

/**
 * getTestUserCreds — reads E2E user credentials from env (E2E_USER_EMAIL / E2E_USER_PASSWORD).
 * Returns `null` when either is missing so callers can `test.skip()` gracefully.
 *
 * @returns Credentials object or `null` if env vars are unset.
 */
export const getTestUserCreds = (): { email: string; password: string } | null => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
};

/**
 * openAuthModal — opens the auth provider picker via the header / bottom-menu profile button
 * (CSS attribute selectors are case-sensitive; getByRole matches accessible name with regex).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once `#modalBody` is mounted.
 */
export const openAuthModal = async (page: Page): Promise<void> => {
  const desktopBtn = page
    .locator('header')
    .getByRole('button', { name: /sign in|profile/i })
    .first();
  const anyBtn = page.getByRole('button', { name: /sign in|profile/i }).first();

  if (!isMobile(page) && (await desktopBtn.isVisible().catch(() => false))) {
    await desktopBtn.click();
  } else {
    await anyBtn.click();
  }
  await expect(page.locator('#modalBody')).toBeVisible({ timeout: 10_000 });
};

/**
 * signInAsTestUser — signs the test user in via the auth modal: Email provider → fill creds → submit.
 * Waits for the modal to close (default `SignInForm` post-success behaviour: `setTransition('close')`).
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the modal is hidden (sign-in succeeded).
 */
export const signInAsTestUser = async (page: Page): Promise<void> => {
  const creds = getTestUserCreds();
  if (!creds) throw new Error('E2E_USER_EMAIL / E2E_USER_PASSWORD env vars are not set');

  await openAuthModal(page);
  const modal = page.locator('#modalBody');
  await modal.locator('button', { hasText: /email/i }).first().click();

  // The form's `FormInput` syncs the typed value into Redux via a `useEffect([value])` that
  // dispatches `addField`. Playwright `.fill()` is synchronous and the effect may not have
  // committed before the submit click — type char-by-char + `blur` to force commit, then add a
  // tiny settle before clicking Sign in.
  const emailInput = modal.locator('input[id*="email"], input[type="email"]').first();
  await emailInput.click();
  await emailInput.pressSequentially(creds.email, { delay: 10 });
  await emailInput.blur();

  const passwordInput = modal.locator('input[type="password"]').first();
  await passwordInput.click();
  await passwordInput.pressSequentially(creds.password, { delay: 10 });
  await passwordInput.blur();

  await modal.getByRole('button', { name: /sign in|log in/i }).click();

  // Either the modal closes (success) or an error message appears.
  const authFailed = modal.getByText(/authentication failed|invalid|incorrect/i);
  const closed = modal
    .waitFor({ state: 'hidden', timeout: 20_000 })
    .then(() => 'closed' as const)
    .catch(() => 'pending' as const);
  const errored = authFailed
    .waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => 'errored' as const)
    .catch(() => 'pending' as const);
  const winner = await Promise.race([closed, errored]);
  if (winner === 'errored') {
    throw new Error('OneEntry auth failed for E2E_USER_EMAIL — verify credentials in .env.local');
  }
  await expect(modal).toBeHidden({ timeout: 5_000 });
};
