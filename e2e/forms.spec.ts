import { expect, test } from '@playwright/test';

import { gotoAndReady, openAuthModal, randomEmail } from './fixtures/helpers';

test.describe('ContactUsForm (/support)', () => {
  test('form renders with the OneEntry schema', async ({ page }) => {
    await gotoAndReady(page, '/support');

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 20_000 });

    const inputs = form.locator('input, textarea');
    await expect(inputs.first()).toBeVisible({ timeout: 15_000 });
    expect(await inputs.count()).toBeGreaterThan(0);

    await expect(form.locator('button[type="submit"], button.cart_btn').first()).toBeVisible();
  });

  test('required fields are marked with an asterisk', async ({ page }) => {
    await gotoAndReady(page, '/support');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 20_000 });
    // Wait until the form schema has actually rendered inputs before looking for the asterisk.
    await expect(form.locator('input, textarea').first()).toBeVisible({ timeout: 15_000 });
    const asterisks = form.locator('span.text-red-500');
    if ((await asterisks.count()) === 0) {
      test.skip(true, 'ContactUs form has no required fields configured in OneEntry');
    }
    await expect(asterisks.first()).toBeVisible();
  });

  test('filling all fields persists values in state', async ({ page }) => {
    await gotoAndReady(page, '/support');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 20_000 });

    const emailInput = form.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('contact@example.test');
      await expect(emailInput).toHaveValue('contact@example.test');
    }

    const textInputs = form.locator('input[type="text"]');
    const textCount = await textInputs.count();
    for (let i = 0; i < textCount; i++) {
      const input = textInputs.nth(i);
      if (await input.isVisible().catch(() => false)) {
        await input.fill(`value ${i}`);
        await expect(input).toHaveValue(`value ${i}`);
      }
    }

    const textarea = form.locator('textarea').first();
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill('Hello from Playwright!');
      await expect(textarea).toHaveValue('Hello from Playwright!');
    }

    const select = form.locator('select').first();
    if (await select.isVisible().catch(() => false)) {
      const options = select.locator('option');
      if ((await options.count()) > 1) {
        const value = await options.nth(1).getAttribute('value');
        if (value) {
          await select.selectOption(value);
          await expect(select).toHaveValue(value);
        }
      }
    }
  });

  test('submit with an invalid email does not hit the server (HTML5 validation)', async ({
    page,
  }) => {
    await gotoAndReady(page, '/support');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 20_000 });

    const emailInput = form.locator('input[type="email"]').first();
    if (!(await emailInput.isVisible().catch(() => false))) test.skip();

    await emailInput.fill('not-an-email');

    let postCalled = false;
    await page.route('**/forms-data/**', route => {
      postCalled = true;
      route.abort();
    });

    await form.locator('button[type="submit"], button.cart_btn').first().click();

    await page.waitForTimeout(500);
    expect(postCalled, 'forms-data POST must not be triggered with invalid email').toBeFalsy();
  });
});

test.describe('ForgotPasswordForm (drawer)', () => {
  test('opens via Reset password from SignInForm', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();
    await expect(modal.locator('input[type="password"]')).toBeVisible();

    const reset = modal.getByRole('button', { name: /reset password|forgot|forgotten/i });
    if (!(await reset.isVisible().catch(() => false))) test.skip();

    await reset.click();

    // After Reset, only the email input remains (mobile + desktop labels may both render in DOM).
    await expect(modal.locator('input[type="email"], input[id*="email"]').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(modal.locator('input[type="password"]')).toHaveCount(0);
    await expect(
      modal.getByRole('button', { name: /send|code|continue|send code/i })
    ).toBeVisible();
  });

  test('submit with empty email does not trigger generateCode', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();
    const reset = modal.getByRole('button', { name: /reset password|forgot|forgotten/i });
    if (!(await reset.isVisible().catch(() => false))) test.skip();
    await reset.click();

    let generateCalled = false;
    await page.route('**/auth/**generate**', route => {
      generateCalled = true;
      route.abort();
    });
    await page.route('**/AuthProvider/**', route => {
      generateCalled = true;
      route.abort();
    });

    await modal
      .getByRole('button', { name: /send|code/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    expect(generateCalled).toBeFalsy();
  });

  test('filling email and submitting triggers the code request', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();
    const reset = modal.getByRole('button', { name: /reset password|forgot|forgotten/i });
    if (!(await reset.isVisible().catch(() => false))) test.skip();
    await reset.click();

    const emailInput = modal.locator('input[type="email"], input[id*="email"]').first();
    await emailInput.fill(randomEmail());

    const reqPromise = page
      .waitForRequest(
        req => /\/(generate|auth-provider|authprovider)/i.test(req.url()) && req.method() !== 'GET',
        { timeout: 10_000 }
      )
      .catch(() => null);

    await modal
      .getByRole('button', { name: /send|code/i })
      .first()
      .click();

    const req = await reqPromise;
    expect(req, 'no generate-OTP request was sent after submit').not.toBeNull();
  });
});
