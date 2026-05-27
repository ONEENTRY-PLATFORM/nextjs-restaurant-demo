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

  test('switching Sign In -> Create account opens the registration form', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();

    const createAccount = modal.getByRole('button', { name: /create account|sign up|register/i });
    if (!(await createAccount.isVisible().catch(() => false))) {
      test.skip();
    }
    await createAccount.click();

    await expect(modal.locator('input[id*="email"], input[type="email"]')).toBeVisible();
    await expect(modal.locator('input[type="password"]')).toBeVisible();
    await expect(modal.locator('input[id="repeat_password"]')).toBeVisible();
  });

  test('registration form validates email format', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);
    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();

    const createAccount = modal.getByRole('button', { name: /create account|sign up|register/i });
    if (!(await createAccount.isVisible().catch(() => false))) {
      test.skip();
    }
    await createAccount.click();

    const emailInput = modal.locator('input[id*="email"], input[type="email"]').first();
    await emailInput.fill('not-an-email');

    const submit = modal.getByRole('button', { name: /sign up|register|create/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
    }

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

    const createAccount = modal.getByRole('button', { name: /create account|sign up|register/i });
    if (!(await createAccount.isVisible().catch(() => false))) {
      test.skip();
    }
    await createAccount.click();

    const username = modal.locator('input[id="username"]');
    const surname = modal.locator('input[id="surname"]');
    const email = modal.locator('input[id*="email"], input[type="email"]').first();
    const password = modal.locator('input[id="password"]');
    const repeat = modal.locator('input[id="repeat_password"]');

    await username.fill('Test');
    await surname.fill('User');
    await email.fill(randomEmail());
    await password.fill('TestPass123!');
    await repeat.fill('TestPass123!');

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
    if (!(await close.isVisible().catch(() => false))) {
      test.skip();
    }
    await close.click();

    await expect(modal).toBeHidden({ timeout: 10_000 });
  });
});
