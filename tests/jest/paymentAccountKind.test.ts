/**
 * paymentAccountKind.test.ts — covers `isOnlinePaymentAccount`, the classifier that decides whether
 * a selected payment account routes through a hosted online checkout (Stripe / PayPal) or settles
 * offline (cash / pay-on-site). It is the branch in `useCreateOrder` / `useSubmitReservation` that
 * triggers `Payments.createSession` + the `window.location.href = paymentUrl` redirect, so getting
 * it wrong either skips Stripe for a card payment or fires a session for a cash order.
 */
import { describe, expect, it } from '@jest/globals';
import type { IAccountsEntity } from 'oneentry/types';

import {
  isOnlinePaymentAccount,
  type PaymentAccountKindInput,
} from '@/app/api/hooks/paymentAccountKind';

/**
 * acct — builds a minimal payment-account input for the classifier (only `type` + `identifier` are read).
 *
 * @param   {PaymentAccountKindInput['type']} type         - SDK account type (`'stripe' | 'yookassa' | 'midtrans' | 'xendit' | 'custom'`).
 * @param   {string}                          [identifier] - Account marker (used to whitelist `custom` online gateways).
 * @returns A {@link PaymentAccountKindInput} for `isOnlinePaymentAccount`.
 */
const acct = (
  type: PaymentAccountKindInput['type'],
  identifier?: string
): PaymentAccountKindInput => ({ type, identifier });

describe('isOnlinePaymentAccount — Stripe', () => {
  it('classifies a stripe account as online regardless of identifier', () => {
    expect(isOnlinePaymentAccount(acct('stripe', 'stripe'))).toBe(true);
    expect(isOnlinePaymentAccount(acct('stripe', 'cards-usd'))).toBe(true);
    // The real account on this project is `{ type: 'stripe', identifier: 'stripe' }`.
    expect(
      isOnlinePaymentAccount({ type: 'stripe', identifier: 'stripe' } as IAccountsEntity)
    ).toBe(true);
  });
});

describe('isOnlinePaymentAccount — named gateway types', () => {
  it('classifies every non-custom gateway type as online', () => {
    expect(isOnlinePaymentAccount(acct('yookassa', 'yookassa'))).toBe(true);
    expect(isOnlinePaymentAccount(acct('midtrans', 'midtrans'))).toBe(true);
    expect(isOnlinePaymentAccount(acct('xendit', 'xendit'))).toBe(true);
  });
});

describe('isOnlinePaymentAccount — custom gateways', () => {
  it('classifies PayPal (custom) as online via the identifier whitelist', () => {
    expect(isOnlinePaymentAccount(acct('custom', 'paypal'))).toBe(true);
  });

  it('matches the whitelist case-insensitively', () => {
    expect(isOnlinePaymentAccount(acct('custom', 'PayPal'))).toBe(true);
    expect(isOnlinePaymentAccount(acct('custom', 'PAYPAL'))).toBe(true);
  });

  it('classifies cash / pay-on-site (custom) as offline', () => {
    expect(isOnlinePaymentAccount(acct('custom', 'cash'))).toBe(false);
    expect(isOnlinePaymentAccount(acct('custom', 'pay_on_site'))).toBe(false);
  });

  it('treats a custom account with no identifier as offline', () => {
    expect(isOnlinePaymentAccount(acct('custom'))).toBe(false);
    expect(isOnlinePaymentAccount(acct('custom', ''))).toBe(false);
  });
});

describe('isOnlinePaymentAccount — guards', () => {
  it('returns false for null / undefined / missing type', () => {
    expect(isOnlinePaymentAccount(null)).toBe(false);
    expect(isOnlinePaymentAccount(undefined)).toBe(false);
    expect(isOnlinePaymentAccount({})).toBe(false);
    expect(isOnlinePaymentAccount(acct(undefined, 'stripe'))).toBe(false);
  });
});
