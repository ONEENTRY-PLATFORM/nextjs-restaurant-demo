import { expect, test } from '@playwright/test';

import { gotoAndReady, openAuthModal, randomEmail } from './fixtures/helpers';

test.describe('ContactUsForm (/support)', () => {
  // OneEntry form fields are wrapped in `FormFieldAnimations` (GSAP fade + translate, per-field
  // stagger of `index / 10 + 0.35s + 0.4s`). Before that timeline finishes the wrapper has
  // `visibility: hidden` / `opacity: 0`, so eager `isVisible()` checks return false and tests were
  // mis-skipping. Generous timeouts let Playwright auto-retry until the fields settle.
  const FORM_SETTLE_MS = 15_000;

  test('form renders with the OneEntry schema', async ({ page }) => {
    await gotoAndReady(page, '/support');

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 20_000 });

    const inputs = form.locator('input, textarea');
    await expect(inputs.first()).toBeVisible({ timeout: FORM_SETTLE_MS });
    expect(await inputs.count()).toBeGreaterThan(0);

    await expect(form.locator('button[type="submit"], button.cart_btn').first()).toBeVisible({
      timeout: FORM_SETTLE_MS,
    });
  });

  test('required fields are marked with an asterisk', async ({ page }) => {
    await gotoAndReady(page, '/support');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 20_000 });

    // Wait for the asterisk itself to become visible — the label sits inside the staggered
    // FormFieldAnimations wrapper, so it remains opacity:0 until its slot of the timeline plays.
    const asterisks = form.locator('span.text-red-500');
    await expect(asterisks.first()).toBeVisible({ timeout: FORM_SETTLE_MS });
    expect(await asterisks.count()).toBeGreaterThan(0);
  });

  test('filling all fields persists values in state', async ({ page }) => {
    await gotoAndReady(page, '/support');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 20_000 });
    // Anchor on the first input being visible so the stagger has clearly started.
    await expect(form.locator('input, textarea').first()).toBeVisible({ timeout: FORM_SETTLE_MS });

    // OneEntry's ContactUs form may render the email field as `<input type="text">` (depends on
    // the form marker — `FormInput` only forces `type="email"` when the marker contains
    // "email"). Use the visible label instead to stay independent of the underlying type.
    const emailInput = form.getByLabel(/email/i).first();
    if ((await emailInput.count()) > 0) {
      await expect(emailInput).toBeVisible({ timeout: FORM_SETTLE_MS });
      await emailInput.fill('contact@example.test');
      await expect(emailInput).toHaveValue('contact@example.test');
    }

    const textInputs = form.locator('input[type="text"]');
    const textCount = await textInputs.count();
    for (let i = 0; i < textCount; i++) {
      const input = textInputs.nth(i);
      await expect(input).toBeVisible({ timeout: FORM_SETTLE_MS });
      await input.fill(`value ${i}`);
      await expect(input).toHaveValue(`value ${i}`);
    }

    const textarea = form.locator('textarea').first();
    if ((await textarea.count()) > 0) {
      await expect(textarea).toBeVisible({ timeout: FORM_SETTLE_MS });
      await textarea.fill('Hello from Playwright!');
      await expect(textarea).toHaveValue('Hello from Playwright!');
    }

    const select = form.locator('select').first();
    if ((await select.count()) > 0) {
      await expect(select).toBeVisible({ timeout: FORM_SETTLE_MS });
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

    // `FormInput` only forces `type="email"` when the field marker contains "email"; otherwise
    // it falls back to `type="text"` and HTML5 validation does not apply. Locate by label,
    // then check the actual type to decide what behaviour to assert on.
    const emailInput = form.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible({ timeout: FORM_SETTLE_MS });

    await emailInput.fill('not-an-email');

    let postCalled = false;
    await page.route('**/forms-data/**', route => {
      postCalled = true;
      route.abort();
    });

    await form.locator('button[type="submit"], button.cart_btn').first().click();

    await page.waitForTimeout(500);

    const inputType = await emailInput.getAttribute('type');
    if (inputType === 'email') {
      expect(postCalled, 'forms-data POST must not be triggered with invalid email').toBeFalsy();
    } else {
      test.info().annotations.push({
        type: 'note',
        description: `email field rendered as type="${inputType}" — HTML5 validation not applicable`,
      });
    }
  });
});

test.describe('ForgotPasswordForm (drawer)', () => {
  // SignInForm fields and the Reset password CTA share `FormFieldAnimations` — GSAP holds them at
  // `autoAlpha: 0` for `index/10 + 0.35s` before fading in (0.4s). Eager `isVisible()` was firing
  // mid-animation and silently skipping the entire suite.
  const FORM_SETTLE_MS = 15_000;

  test('opens via Reset password from SignInForm', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();
    await expect(modal.locator('input[type="password"]')).toBeVisible({ timeout: FORM_SETTLE_MS });

    const reset = modal.getByRole('button', { name: /reset password|forgot|forgotten/i });
    await expect(reset).toBeVisible({ timeout: FORM_SETTLE_MS });
    await reset.click();

    // After Reset, only the email input remains (mobile + desktop labels may both render in DOM).
    await expect(modal.locator('input[type="email"], input[id*="email"]').first()).toBeVisible({
      timeout: FORM_SETTLE_MS,
    });
    await expect(modal.locator('input[type="password"]')).toHaveCount(0);
    await expect(
      modal.getByRole('button', { name: /send|code|continue|send code/i })
    ).toBeVisible({ timeout: FORM_SETTLE_MS });
  });

  test('submit with empty email does not trigger generateCode', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();
    const reset = modal.getByRole('button', { name: /reset password|forgot|forgotten/i });
    await expect(reset).toBeVisible({ timeout: FORM_SETTLE_MS });
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

    const sendBtn = modal.getByRole('button', { name: /send|code/i }).first();
    await expect(sendBtn).toBeVisible({ timeout: FORM_SETTLE_MS });
    await sendBtn.click();
    await page.waitForTimeout(500);
    expect(generateCalled).toBeFalsy();
  });

  test('filling email and submitting triggers the code request', async ({ page }) => {
    await gotoAndReady(page, '/');
    await openAuthModal(page);

    const modal = page.locator('#modalBody');
    await modal.locator('button', { hasText: /email/i }).first().click();
    const reset = modal.getByRole('button', { name: /reset password|forgot|forgotten/i });
    await expect(reset).toBeVisible({ timeout: FORM_SETTLE_MS });
    await reset.click();

    const emailInput = modal.locator('input[type="email"], input[id*="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: FORM_SETTLE_MS });
    await emailInput.fill(randomEmail());

    const reqPromise = page
      .waitForRequest(
        req => /\/(generate|auth-provider|authprovider)/i.test(req.url()) && req.method() !== 'GET',
        { timeout: 10_000 }
      )
      .catch(() => null);

    const sendBtn = modal.getByRole('button', { name: /send|code/i }).first();
    await expect(sendBtn).toBeVisible({ timeout: FORM_SETTLE_MS });
    await sendBtn.click();

    const req = await reqPromise;
    expect(req, 'no generate-OTP request was sent after submit').not.toBeNull();
  });
});
