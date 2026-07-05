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
  // On mobile the desktop-header "Sign in" button (first in DOM) is `display:none`, while the visible
  // trigger is the bottom-menu "Profile" button — filter to the visible one, otherwise `.first()`
  // targets the hidden desktop button and the click hangs until timeout.
  const anyBtn = page
    .getByRole('button', { name: /sign in|profile/i })
    .filter({ visible: true })
    .first();

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

  // Success = the sign-in form leaves the modal. On desktop the modal closes; on MOBILE the drawer
  // does NOT close — NavItemProfile sets `postAuthComponent='ProfilePopup'`, so on success the drawer
  // swaps to the ProfilePopup and `#modalBody` stays mounted. "Modal hidden" is therefore not a
  // portable signal; the password field is gone on success and stays (with an error) on failure.
  const authFailed = modal.getByText(/authentication failed|invalid|incorrect/i);
  const passwordField = modal.locator('input[type="password"]');
  const succeeded = passwordField
    .first()
    .waitFor({ state: 'detached', timeout: 20_000 })
    .then(() => 'ok' as const)
    .catch(() => 'pending' as const);
  const errored = authFailed
    .waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => 'errored' as const)
    .catch(() => 'pending' as const);
  const winner = await Promise.race([succeeded, errored]);
  if (winner === 'errored') {
    throw new Error('OneEntry auth failed for E2E_USER_EMAIL — verify credentials in .env.local');
  }
  await expect(passwordField).toHaveCount(0, { timeout: 5_000 });
};

/**
 * waitForAuthedHeader — waits until the header renders the authenticated Profile link.
 *
 * After a full reload `isAuth` is restored asynchronously from the stored token; acting before it
 * settles lands on the guest path (e.g. cart APPLY opens the auth modal). The desktop header's
 * `a[href="/profile"]` link renders ONLY when authenticated — but on mobile that header is
 * `display:none`, so gate on `toBeAttached` (present in the DOM) rather than `toBeVisible`, which is a
 * portable auth signal on both viewports.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once the authed Profile link is in the DOM.
 */
export const waitForAuthedHeader = async (page: Page): Promise<void> => {
  await expect(page.locator('header a[href="/profile"]').first()).toBeAttached({ timeout: 15_000 });
};

/**
 * addInStockProductToCart — adds a guaranteed in-stock product to the cart via its product page.
 *
 * The catalog grid runs a GSAP entrance animation; when the authed cart state hydrates it can
 * re-trigger and leave cards transiently hidden, so clicking an in-card add button is flaky in the
 * checkout flow. Instead this collects product links from `/shop` (hrefs read from the DOM, so
 * hidden cards are fine), then opens each product page and adds the first one whose CTA is enabled
 * (out-of-stock CTAs are disabled). Mirrors the product-page approach in `payment-stripe.spec.ts`.
 *
 * @param   {Page}   page - Playwright page.
 * @returns Promise resolving once a product has been added (its CTA swapped to the quantity selector).
 */
export const addInStockProductToCart = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/shop');
  const hrefs: string[] = await page
    .locator('.menu_item a[href^="/shop/product/"]')
    .evaluateAll(els =>
      Array.from(new Set(els.map(e => (e as HTMLAnchorElement).getAttribute('href') ?? ''))).filter(
        Boolean
      )
    );
  if (hrefs.length === 0) throw new Error('no product links found on /shop');

  for (const href of hrefs.slice(0, 8)) {
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.locator('.shop_section')).toBeVisible({ timeout: 20_000 });

    // A product already in the cart (the authed user's synced cart) renders the QuantitySelector
    // instead of the add CTA — that already satisfies "cart is non-empty", so we're done.
    const decrease = page.getByRole('button', { name: /decrease/i }).first();
    if (await decrease.isVisible().catch(() => false)) return;

    const cta = page.getByRole('button', { name: /to cart|out of stock/i }).first();
    if (!(await cta.isVisible().catch(() => false))) continue;
    if (await cta.isDisabled()) continue; // out of stock — try the next candidate

    await cta.click();
    // The CTA swaps to the QuantitySelector (a decrease button) once the item is in the cart.
    await expect(decrease).toBeVisible({ timeout: 10_000 });
    return;
  }
  throw new Error('no addable product found among the first candidates');
};

/**
 * openOrderStep — drives an already signed-in user to the checkout `order` step.
 *
 * The authed test user's server-synced cart is typically already populated, so this opens `/cart`
 * and uses the existing rows; only if the cart is empty does it add an in-stock product first (via
 * a product page, resilient to the grid animation). It then clicks the cart APPLY button (authed →
 * dispatches `setStep('order')`) and waits for the order rows to mount.
 *
 * @param   {Page}   page - Playwright page (must already be signed in).
 * @returns Promise resolving once the `order` step (`.step-order-row`) is visible.
 */
export const openOrderStep = async (page: Page): Promise<void> => {
  await gotoAndReady(page, '/cart');
  await waitForAuthedHeader(page);

  const cartHasItem = await page
    .locator('.product-in-cart')
    .first()
    .isVisible({ timeout: 8_000 })
    .catch(() => false);
  if (!cartHasItem) {
    await addInStockProductToCart(page);
    await gotoAndReady(page, '/cart');
    await waitForAuthedHeader(page);
    await expect(page.locator('.product-in-cart').first()).toBeVisible({ timeout: 20_000 });
  }

  const apply = page.locator('button.cart-apply-btn').first();
  await expect(apply).toBeVisible({ timeout: 20_000 });
  await apply.click();

  await expect(page.locator('.step-order-row').first()).toBeVisible({ timeout: 20_000 });
};

/**
 * openPaymentStep — drives an already signed-in user through `order` to the `payment` step.
 *
 * Extends {@link openOrderStep} by clicking StepOrder's proceed button (the only `step-order-row`
 * that is also `bg-brand`) and waiting for the payment rows to mount.
 *
 * @param   {Page}   page - Playwright page (must already be signed in).
 * @returns Promise resolving once the `payment` step (`.step-payment-row`) is visible.
 */
export const openPaymentStep = async (page: Page): Promise<void> => {
  await openOrderStep(page);

  const proceed = page.locator('button.step-order-row.bg-brand').first();
  await expect(proceed).toBeVisible({ timeout: 20_000 });
  await proceed.click();

  await expect(page.locator('.step-payment-row').first()).toBeVisible({ timeout: 20_000 });
};

/**
 * swipeDownToClose — simulates a downward swipe-to-dismiss on a bottom-sheet / drawer (mobile).
 *
 * Dispatches touchstart → touchmove → touchend with a 200px downward delta, satisfying both swipe
 * implementations in the app: the inline CategoryFilter handler (reads `changedTouches` on touchend,
 * 80px threshold) and `useSwipeToClose` (reads `touches` on touchmove, 100px threshold, then closes on
 * the follow-up `transitionend`). Touch-capable Chromium only (the mobile-chrome project).
 *
 * @param   {Locator} drawer - Locator for the drawer/sheet root that carries the swipe listeners.
 * @returns Promise resolving once the gesture is dispatched and the close transition has settled.
 */
export const swipeDownToClose = async (drawer: Locator): Promise<void> => {
  await drawer.evaluate((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left + Math.min(rect.width / 2, 150));
    const startY = Math.round(rect.top + 20);
    const mk = (type: string, y: number): TouchEvent => {
      const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
      const lifted = type === 'touchend';
      return new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: lifted ? [] : [touch],
        targetTouches: lifted ? [] : [touch],
        changedTouches: [touch],
      });
    };
    el.dispatchEvent(mk('touchstart', startY));
    el.dispatchEvent(mk('touchmove', startY + 200));
    el.dispatchEvent(mk('touchend', startY + 200));
  });
  // useSwipeToClose finishes the close on a 140–280ms transition → transitionend → React unmount.
  await drawer.page().waitForTimeout(700);
};
