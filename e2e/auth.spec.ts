import { expect, test } from '@playwright/test';

import { gotoAndReady, openAuthModal, randomEmail } from './fixtures/helpers';

test.describe('Auth modal', () => {
  test('modal opens from the header / bottom menu', async ({ page }) => {
    await gotoAndReady(page, '/');

    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button').first()).toBeVisible();
  });

  test('clicking the Email provider opens the sign-in form', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    const emailBtn = modal.locator('button', { hasText: /email/i }).first();
    await expect(emailBtn).toBeVisible({ timeout: 10_000 });
    await emailBtn.click();

    await expect(modal.locator('input[type="email"], input[id*="email"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(modal.locator('input[type="password"]')).toBeVisible();
    await expect(modal.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('sign-in form: empty submit is not sent (HTML5 required or no-op)', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();

    const submit = modal.getByRole('button', { name: /sign in|log in/i });
    await expect(submit).toBeVisible();
    await submit.click();

    await expect(modal).toBeVisible();
    await expect(modal.locator('input[type="password"]')).toBeVisible();
  });

  test('sign-in form: invalid credentials show an error', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();

    await modal.locator('input[id*="email"], input[type="email"]').fill('nobody@example.test');
    await modal.locator('input[type="password"]').fill('wrong-password-123');
    await modal.getByRole('button', { name: /sign in|log in/i }).click();

    const errorOrModal = modal.locator('text=/error|invalid|incorrect|wrong/i').first();
    await expect
      .poll(
        async () =>
          (await errorOrModal.isVisible().catch(() => false)) || (await modal.isVisible()),
        { timeout: 15_000 }
      )
      .toBeTruthy();

    await expect(modal).toBeVisible();
  });

  // Modal mounts via PopupRoot and the email-provider form animates in — eager visibility checks
  // were racing the mount and mis-skipping these tests. Use an explicit wait instead.
  const MODAL_SETTLE_MS = 15_000;

  test('switching Sign In -> Create account opens the registration form', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();

    const createAccount = modal.getByRole('button', {
      name: /create( an)? account|sign up|register/i,
    });
    await expect(createAccount).toBeVisible({ timeout: MODAL_SETTLE_MS });
    await createAccount.click();

    // `ModalScreenSwap` keeps both SignIn and SignUp screens mounted during the cross-fade — so
    // `input[id*="email"]` would match two elements (strict-mode violation). Wait on the
    // SignUp-only `repeat_password` first to confirm the swap committed, then it's safe to scope
    // the email assertion with `.first()`.
    await expect(modal.locator('input[id="repeat_password"]')).toBeVisible({
      timeout: MODAL_SETTLE_MS,
    });
    await expect(modal.locator('input[id*="email"], input[type="email"]').first()).toBeVisible();
    await expect(modal.locator('input[type="password"]').first()).toBeVisible();
  });

  test('registration form validates email format', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();

    const createAccount = modal.getByRole('button', {
      name: /create( an)? account|sign up|register/i,
    });
    await expect(createAccount).toBeVisible({ timeout: MODAL_SETTLE_MS });
    await createAccount.click();

    const emailInput = modal.locator('input[id*="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: MODAL_SETTLE_MS });
    await emailInput.fill('not-an-email');

    const submit = modal.getByRole('button', { name: /sign up|register|create/i }).first();
    await expect(submit).toBeVisible({ timeout: MODAL_SETTLE_MS });
    await submit.click();

    await expect(modal).toBeVisible();
    await expect(emailInput).toBeVisible();
  });

  test('filling the registration form generates a unique email and keeps the screen', async ({
    page,
  }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();

    const createAccount = modal.getByRole('button', {
      name: /create( an)? account|sign up|register/i,
    });
    await expect(createAccount).toBeVisible({ timeout: MODAL_SETTLE_MS });
    await createAccount.click();

    const username = modal.locator('input[id="username"]');
    const surname = modal.locator('input[id="surname"]');
    const email = modal.locator('input[id*="email"], input[type="email"]').first();
    const password = modal.locator('input[id="password"]');
    const repeat = modal.locator('input[id="repeat_password"]');

    await expect(username).toBeVisible({ timeout: MODAL_SETTLE_MS });
    await username.fill('Test');
    await surname.fill('User');
    await email.fill(randomEmail());
    await password.fill('TestPass123!');
    await repeat.fill('TestPass123!');

    // `phone` is optional in the OneEntry form schema — fill it when present, do not skip otherwise.
    const phone = modal.locator('input[id="phone"]');
    if (await phone.isVisible().catch(() => false)) {
      await phone.fill('+15555550100');
    }

    await expect(email).toHaveValue(/example\.test$/);
    await expect(repeat).toHaveValue('TestPass123!');
  });

  test('closing the modal via the Close button returns to page content', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await expect(modal).toBeVisible();

    const close = page.locator('#modalBody').getByRole('button', { name: /close/i }).first();
    await expect(close).toBeVisible({ timeout: MODAL_SETTLE_MS });
    await close.click();

    await expect(modal).toBeHidden({ timeout: 10_000 });
  });
});
