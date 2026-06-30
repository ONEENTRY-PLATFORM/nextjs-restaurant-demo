/**
 * checkoutAccounts.test.ts — covers `filterAllowedAccounts`, which decides WHICH payment accounts
 * (Stripe / cash / …) are offered at the delivery checkout. Selecting an account that the order
 * storage does not link makes `Orders.createOrder` fail with 400 "Your payment account is not
 * connected", so this filter both hides unused accounts and intersects with the storage whitelist.
 */
import { describe, expect, it } from '@jest/globals';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';

import { filterAllowedAccounts } from '@/app/api/hooks/checkout.utils';

/**
 * account — builds a minimal payment-account entity for the filter (only id/identifier/visibility read).
 *
 * @param   {string}  identifier  - Account marker.
 * @param   {object}  [flags]     - Visibility flags.
 * @param   {boolean} [flags.isVisible] - `isVisible` flag (defaults to visible).
 * @param   {boolean} [flags.isUsed]    - `isUsed` flag (defaults to used).
 * @returns A partial {@link IAccountsEntity} cast for the filter.
 */
const account = (
  identifier: string,
  flags: { isVisible?: boolean; isUsed?: boolean } = {}
): IAccountsEntity =>
  ({
    id: identifier.length,
    identifier,
    isVisible: flags.isVisible ?? true,
    isUsed: flags.isUsed ?? true,
  }) as unknown as IAccountsEntity;

describe('filterAllowedAccounts — visibility', () => {
  it('keeps only visible AND used accounts', () => {
    const accounts = [
      account('stripe'),
      account('cash'),
      account('hidden', { isVisible: false }),
      account('unused', { isUsed: false }),
    ];
    const result = filterAllowedAccounts(accounts).map(a => a.identifier);
    expect(result).toEqual(['stripe', 'cash']);
  });

  it('returns an empty array for no accounts', () => {
    expect(filterAllowedAccounts(undefined)).toEqual([]);
    expect(filterAllowedAccounts([])).toEqual([]);
  });
});

describe('filterAllowedAccounts — storage whitelist', () => {
  it('intersects visible accounts with the storage-linked identifiers', () => {
    const accounts = [account('stripe'), account('cash'), account('paypal')];
    const allowed = new Set(['stripe', 'cash']);
    const result = filterAllowedAccounts(accounts, allowed).map(a => a.identifier);
    expect(result).toEqual(['stripe', 'cash']);
  });

  it('keeps Stripe when it is the only linked account', () => {
    const accounts = [account('stripe'), account('cash')];
    const result = filterAllowedAccounts(accounts, new Set(['stripe'])).map(a => a.identifier);
    expect(result).toEqual(['stripe']);
  });

  it('falls back to all visible accounts when the storage links none (empty set)', () => {
    const accounts = [account('stripe'), account('cash')];
    const result = filterAllowedAccounts(accounts, new Set()).map(a => a.identifier);
    expect(result).toEqual(['stripe', 'cash']);
  });

  it('drops a linked-but-hidden account', () => {
    const accounts = [account('stripe', { isVisible: false }), account('cash')];
    const result = filterAllowedAccounts(accounts, new Set(['stripe', 'cash'])).map(
      a => a.identifier
    );
    expect(result).toEqual(['cash']);
  });
});
