import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';

/**
 * Identifiers of online payment gateways whose `type` is reported as `'custom'` by the SDK.
 *
 * `IAccountsEntity.type` only distinguishes `'stripe'` from `'custom'`, so async online providers
 * (PayPal) are indistinguishable from offline ones (cash, on-site) by `type` alone — they are
 * separated here by identifier. Extend this list when wiring a new online gateway in the admin panel.
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
 * Stripe accounts are always online. Other accounts carry `type: 'custom'`, which covers both online
 * gateways (PayPal) and offline methods (cash, pay-on-site); those are separated by the identifier
 * whitelist rather than a hard-coded `'cash'` string, so renaming the offline account in the admin panel
 * no longer mis-routes the order through a payment session.
 *
 * @param   {PaymentAccountKindInput | null}  [account]            - Selected payment account (its `type` and `identifier`).
 * @param   {PaymentAccountKindInput['type']} [account.type]       - SDK account type (`'stripe' | 'custom'`).
 * @param   {string | null}                   [account.identifier] - Account marker, used to whitelist `custom` online gateways.
 * @returns `true` when the account needs an online checkout session, `false` for offline settlement.
 */
export const isOnlinePaymentAccount = (account?: PaymentAccountKindInput | null): boolean => {
  if (!account) return false;
  if (account.type === 'stripe') return true;
  return ONLINE_CUSTOM_IDENTIFIERS.has((account.identifier ?? '').toLowerCase());
};
