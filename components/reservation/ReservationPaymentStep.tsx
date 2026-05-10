'use client';

import Image from 'next/image';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';
import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useGetAccountsQuery, useGetOrderStorageByMarkerQuery } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import ErrorMessage from '@/components/forms/inputs/ErrorMessage';

/**
 * Visual category for a payment method per Figma 120:1875.
 * `card` - Stripe (Visa/MC), `paypal` - PayPal, `wallet` - Apple/Google Pay (text),
 * `other` - fallback (including cash).
 */
type PaymentVisualKind = 'card' | 'paypal' | 'wallet' | 'other';

/**
 * resolveVisualKind — maps a OneEntry payment account to the visual category used in the UI.
 *
 * @param   {IAccountsEntity}   account - OneEntry payment account entity.
 * @returns {PaymentVisualKind}           Visual kind (`card` | `paypal` | `wallet` | `other`).
 */
const resolveVisualKind = (account: IAccountsEntity): PaymentVisualKind => {
  const type = account.type?.toLowerCase();
  const id = account.identifier?.toLowerCase();
  if (type === 'stripe') return 'card';
  if (id === 'paypal') return 'paypal';
  if (id === 'apple_pay' || id === 'google_pay' || id === 'apple-pay' || id === 'google-pay') {
    return 'wallet';
  }
  return 'other';
};

type ReservationPaymentStepProps = {
  onApply: (paymentAccountIdentifier: string) => void;
  isLoading: boolean;
  error: string;
  onBack: () => void;
};

/**
 * ReservationPaymentStep — payment-method selection step for the booking.
 *
 * Account list = `Payments.getAccounts()` (filtered by `isVisible && isUsed`) intersected with
 * `storage.paymentAccountIdentifiers` from `getOrderStorageByMarker('booking_order')`, otherwise
 * `createOrder` fails with 400 "Your payment account is not connected".
 *
 * @param   {ReservationPaymentStepProps}  props           - Component props.
 * @param   {(id: string) => void}         props.onApply   - Called with the selected `paymentAccountIdentifier` when the user confirms.
 * @param   {boolean}                      props.isLoading - When `true`, disables the apply button.
 * @param   {string}                       props.error     - Error message displayed under the radio list.
 * @param   {() => void}                   props.onBack    - Returns the wizard to the form step.
 * @returns {JSX.Element}                                    JSX of the payment-method selection step.
 */
const ReservationPaymentStep = ({
  onApply,
  isLoading,
  error,
  onBack,
}: ReservationPaymentStepProps): JSX.Element => {
  const t = useT();
  const { data, isLoading: isAccountsLoading } = useGetAccountsQuery({});
  const { data: storage, isLoading: isStorageLoading } = useGetOrderStorageByMarkerQuery({
    marker: 'booking_order',
  });

  const allowedIdentifiers = useMemo(() => {
    const list = (storage?.paymentAccountIdentifiers ?? []) as Array<{ identifier: string }>;
    return new Set(list.map(x => x.identifier));
  }, [storage]);

  const accounts = useMemo<IAccountsEntity[]>(() => {
    const visible = (data ?? []).filter(a => a.isVisible !== false && a.isUsed !== false);
    if (allowedIdentifiers.size === 0) return visible;
    return visible.filter(a => allowedIdentifiers.has(a.identifier));
  }, [data, allowedIdentifiers]);

  const [selected, setSelected] = useState<string>('');

  // Default to Stripe (Credit & Debit) per Figma; if missing, pick the first one in the list.
  useEffect(() => {
    if (selected || accounts.length === 0) return;
    const stripe = accounts.find(a => resolveVisualKind(a) === 'card');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((stripe ?? accounts[0]!).identifier);
  }, [accounts, selected]);

  return (
    <div className="flex w-full flex-col items-center gap-6.25 px-5 md:px-19">
      {/* 30% deposit notice - Figma: 368×54, gray-50% bg, orange Lato 16/20 center */}
      <div className="flex w-full items-center justify-center rounded-card bg-ink/50 px-2.5 py-2.5 backdrop-blur-card">
        <p className="text-center font-normal text-base leading-5 text-brand">
          {t('booking_deposit_text', '30% deposit is required to confirm your booking')}
        </p>
      </div>

      {/* Radio list of payment methods */}
      <div className="flex w-full flex-col gap-3.75">
        {isAccountsLoading || isStorageLoading ? (
          <p className="text-paper/70">{t('loading_text', 'Loading')}</p>
        ) : accounts.length === 0 ? (
          <p className="text-paper/70">
            {t('no_payment_methods', 'No payment methods are configured. Please contact support.')}
          </p>
        ) : (
          accounts.map(account => (
            <PaymentRow
              key={account.identifier}
              account={account}
              checked={selected === account.identifier}
              onSelect={() => setSelected(account.identifier)}
            />
          ))
        )}
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      {/* Apply button - Figma: 95×36, orange outline, text #EC722B */}
      <div className="mt-2.5 flex items-center justify-center gap-3.75">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 items-center justify-center rounded-card border border-paper px-5 font-normal text-base text-paper hover:opacity-80"
        >
          {t('back_text', 'Back')}
        </button>
        <button
          type="button"
          onClick={() => selected && onApply(selected)}
          disabled={isLoading || !selected}
          className="flex h-9 w-23.75 items-center justify-center rounded-card border border-brand font-normal text-base text-brand hover:bg-brand/10 disabled:opacity-60"
        >
          {isLoading ? '...' : t('apply_text', 'Apply')}
        </button>
      </div>
    </div>
  );
};

/**
 * PaymentRow — radio row for a single payment account.
 *
 * @param   {object}            props          - Component props.
 * @param   {IAccountsEntity}   props.account  - OneEntry payment account entity.
 * @param   {boolean}           props.checked  - Whether the row is currently selected.
 * @param   {() => void}        props.onSelect - Selection callback invoked on radio change.
 * @returns {JSX.Element}                        JSX of the payment row.
 */
const PaymentRow = ({
  account,
  checked,
  onSelect,
}: {
  account: IAccountsEntity;
  checked: boolean;
  onSelect: () => void;
}): JSX.Element => {
  const t = useT();
  const kind = resolveVisualKind(account);
  const id = `pay-${account.identifier}`;

  // Label per Figma: card -> "Credit & Debit Cards", others -> "Pay with".
  const label =
    kind === 'card'
      ? t('booking_credit_cards', 'Credit & Debit Cards')
      : t('booking_pay_with', 'Pay with');

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer select-none items-center gap-2.25 text-paper"
    >
      <input
        type="radio"
        id={id}
        name="reservation-payment"
        checked={checked}
        onChange={onSelect}
        className="hidden peer"
      />
      <span
        className={
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ' +
          (checked ? 'border-brand' : 'border-paper')
        }
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
      </span>
      <span className="font-normal text-base text-paper">{label}</span>
      <PaymentLogos kind={kind} fallback={account.localizeInfos?.title || account.identifier} />
    </label>
  );
};

/**
 * PaymentLogos — payment-system logos for the selection row.
 *
 * No assets exist for Apple/Google Pay — render a text fallback.
 *
 * @param   {object}             props          - Component props.
 * @param   {PaymentVisualKind}  props.kind     - Payment method category.
 * @param   {string}             props.fallback - Text used for the fallback variant.
 * @returns {JSX.Element}                         JSX of the logo group.
 */
const PaymentLogos = ({
  kind,
  fallback,
}: {
  kind: PaymentVisualKind;
  fallback: string;
}): JSX.Element => {
  if (kind === 'paypal') {
    return <Image src="/images/icons/paypal.png" alt="PayPal" width={68} height={18} unoptimized />;
  }
  if (kind === 'card') {
    return (
      <span className="flex items-center gap-1.5">
        <Image src="/images/icons/visa.png" alt="Visa" width={36} height={12} unoptimized />
        <span className="flex h-7 w-11.5 items-center justify-center rounded-card bg-paper">
          <Image
            src="/images/icons/mastercart.png"
            alt="Mastercard"
            width={28}
            height={18}
            unoptimized
          />
        </span>
      </span>
    );
  }
  return <span className="text-base text-paper/80 capitalize">{fallback}</span>;
};

export default ReservationPaymentStep;
