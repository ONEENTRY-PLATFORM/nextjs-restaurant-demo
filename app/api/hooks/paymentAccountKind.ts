import type { IAccountsEntity } from 'oneentry/types';

/**
 * Account types the SDK reports for a hosted payment gateway (`IAccountsEntity['type']`, SDK 1.0.161).
 *
 * Everything the API names explicitly is an online provider; `'custom'` is the catch-all bucket that
 * also holds offline methods, so it is resolved by identifier instead.
 */
const ONLINE_ACCOUNT_TYPES = new Set<string>(['stripe', 'yookassa', 'midtrans', 'xendit']);

/**
 * Identifiers of online payment gateways whose `type` is reported as `'custom'` by the SDK.
 *
 * The `'custom'` type covers async online providers (PayPal) and offline ones (cash, on-site)
 * alike, so they are separated here by identifier. Extend this list when wiring a new online
 * gateway in the admin panel.
 */
const ONLINE_CUSTOM_IDENTIFIERS = new Set<string>(['paypal']);

/** Minimal shape needed to classify a payment account (subset of {@link IAccountsEntity}). */
export type PaymentAccountKindInput = {
  type?: IAccountsEntity['type'] | undefined;
  identifier?: string | null | undefined;
};

/**
 * isOnlinePaymentAccount — whether a payment account requires a hosted checkout (online) vs offline settlement.
 *
 * Named gateway types (Stripe, YooKassa, Midtrans, Xendit) are always online. The remaining accounts
 * carry `type: 'custom'`, which covers both online gateways (PayPal) and offline methods (cash,
 * pay-on-site); those are separated by the identifier whitelist rather than a hard-coded `'cash'`
 * string, so renaming the offline account in the admin panel no longer mis-routes the order through
 * a payment session.
 *
 * @param   {PaymentAccountKindInput | null}  [account]            - Selected payment account (its `type` and `identifier`).
 * @param   {PaymentAccountKindInput['type']} [account.type]       - SDK account type (`'stripe' | 'yookassa' | 'midtrans' | 'xendit' | 'custom'`).
 * @param   {string | null}                   [account.identifier] - Account marker, used to whitelist `custom` online gateways.
 * @returns `true` when the account needs an online checkout session, `false` for offline settlement.
 */
export const isOnlinePaymentAccount = (account?: PaymentAccountKindInput | null): boolean => {
  if (!account) return false;
  if (account.type && ONLINE_ACCOUNT_TYPES.has(account.type)) return true;
  return ONLINE_CUSTOM_IDENTIFIERS.has((account.identifier ?? '').toLowerCase());
};
