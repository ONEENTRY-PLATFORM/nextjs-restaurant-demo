'use client';

import Image from 'next/image';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';
import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useGetAccountsQuery } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import ErrorMessage from '@/components/forms/inputs/ErrorMessage';

/**
 * Категория визуального представления способа оплаты по Figma 120:1875.
 *
 *  - `card` — Credit & Debit Cards (Stripe), показывает иконки Visa/MC.
 *  - `paypal` — PayPal, показывает PayPal-лого.
 *  - `wallet` — Apple Pay / Google Pay (нет ассетов в проекте, рендерим
 *     текстовое имя).
 *  - `other` — fallback (включая `cash`, если он сконфигурирован в storage).
 */
type PaymentVisualKind = 'card' | 'paypal' | 'wallet' | 'other';

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
 * Шаг выбора способа оплаты для бронирования столика. Соответствует
 * Figma `120:1875` в `Rest_desktop` — отрисовывает плашку про депозит,
 * радио-список платёжных методов и кнопки Back/Apply. Карточная форма
 * на этом шаге не рендерится: для Stripe `Payments.createSession`
 * возвращает `paymentUrl` на hosted Stripe Checkout, и юзер вводит
 * реквизиты уже там (см. `ReservationForm.onApplyPayment`).
 *
 * Список аккаунтов берётся из `Payments.getAccounts()` (фильтруем
 * `isVisible && isUsed`). Storage-specific фильтрация по
 * `paymentAccountIdentifiers` сейчас не делается — `getAllOrdersStorage`
 * требует user-токен, и его в момент попапа может ещё не быть.
 * @param   {ReservationPaymentStepProps} props - Пропсы шага.
 * @returns {JSX.Element}                       JSX шага оплаты.
 */
const ReservationPaymentStep = ({
  onApply,
  isLoading,
  error,
  onBack,
}: ReservationPaymentStepProps): JSX.Element => {
  const t = useT();
  const { data, isLoading: isAccountsLoading } = useGetAccountsQuery({});

  const accounts = useMemo<IAccountsEntity[]>(
    () => (data ?? []).filter(a => a.isVisible !== false && a.isUsed !== false),
    [data]
  );

  const [selected, setSelected] = useState<string>('');

  // Когда подгрузились аккаунты — выбираем по умолчанию Stripe (Credit
  // & Debit), как в Figma. Если его нет — первый из списка.
  useEffect(() => {
    if (selected || accounts.length === 0) return;
    const stripe = accounts.find(a => resolveVisualKind(a) === 'card');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((stripe ?? accounts[0]!).identifier);
  }, [accounts, selected]);

  return (
    <div className="flex w-full flex-col items-center gap-6.25 px-5 md:px-19">
      {/* 30% deposit notice — Figma: 368×54, gray-50% bg, orange Lato 16/20 center */}
      <div className="flex w-full items-center justify-center rounded-[5px] bg-ink/50 px-2.5 py-2.5 backdrop-blur-[10px]">
        <p className="text-center font-normal text-[16px] leading-5 text-brand">
          {t('booking_deposit_text', '30% deposit is required to confirm your booking')}
        </p>
      </div>

      {/* Радио-список способов оплаты */}
      <div className="flex w-full flex-col gap-3.75">
        {isAccountsLoading ? (
          <p className="text-paper/70">{t('loading_text', 'Loading…')}</p>
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

      {/* Apply button — Figma: 95×36, оранжевая обводка, текст #EC722B */}
      <div className="mt-2.5 flex items-center justify-center gap-3.75">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 items-center justify-center rounded-[5px] border border-paper px-5 font-normal text-[16px] text-paper hover:opacity-80"
        >
          {t('back_text', 'Back')}
        </button>
        <button
          type="button"
          onClick={() => selected && onApply(selected)}
          disabled={isLoading || !selected}
          className="flex h-9 w-23.75 items-center justify-center rounded-[5px] border border-brand font-normal text-[16px] text-brand hover:bg-brand/10 disabled:opacity-60"
        >
          {isLoading ? '...' : t('apply_text', 'Apply')}
        </button>
      </div>
    </div>
  );
};

/**
 * Радио-строка одного payment-аккаунта. Цвет круга/текста по Figma —
 * paper для невыбранного, brand для выбранного.
 * @param   {object}          props          - Пропсы строки.
 * @param   {IAccountsEntity} props.account  - Платёжный аккаунт.
 * @param   {boolean}         props.checked  - Активна ли строка.
 * @param   {() => void}      props.onSelect - Колбэк выбора.
 * @returns {JSX.Element}                    JSX строки.
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

  // Лейбл по Figma:
  //   - card → "Credit & Debit Cards"
  //   - paypal/wallet/other → "Pay with"
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
      <span className="font-normal text-[16px] text-paper">{label}</span>
      <PaymentLogos kind={kind} fallback={account.localizeInfos?.title || account.identifier} />
    </label>
  );
};

/**
 * Логотипы платёжной системы для строки выбора по Figma. Для Apple/Google
 * Pay в проекте нет ассетов — рендерим текстовый fallback.
 * @param   {object}             props          - Пропсы.
 * @param   {PaymentVisualKind}  props.kind     - Категория способа оплаты.
 * @param   {string}             props.fallback - Текст для fallback-варианта.
 * @returns {JSX.Element}                       JSX логотипов.
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
        <span className="flex h-7 w-11.5 items-center justify-center rounded-[5px] bg-paper">
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
  return <span className="text-[16px] text-paper/80 capitalize">{fallback}</span>;
};

export default ReservationPaymentStep;
