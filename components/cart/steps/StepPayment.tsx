'use client';

import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import { useCreateOrder, useGetAccountsQuery } from '@/app/api';
import { useAppDispatch } from '@/app/store/hooks';
import {
  addData,
  addPaymentMethod,
  setStep,
  setStepError,
} from '@/app/store/reducers/OrderSlice';

/**
 * Шаг checkout — выбор метода оплаты (по `cart_PAYMENT.html`).
 *
 * Список методов берётся из OneEntry Payments API
 * (`getApi().Payments.getAccounts()` через {@link useGetAccountsQuery}) —
 * показываются только `isVisible === true` аккаунты, отсортированные
 * по `id`. Лейбл = `localizeInfos.title`, идентификатор для submit'а
 * = `identifier`. По типу (`type`) добавляется тематическая иконка:
 *  - `paypal` → лого PayPal
 *  - `stripe` → Visa + Mastercard (Stripe Checkout принимает карты)
 *  - `custom` (cash, etc.) → без иконки
 *
 * Ниже — textbox комментария + чекбокс «order taken by another person».
 *
 * При submit:
 *  1) Сохраняем `comment` / `alt_phone` через `addData`.
 *  2) Кладём identifier в `addPaymentMethod` (для последующих экранов).
 *  3) Вызываем `onConfirmOrder({ paymentAccountIdentifier })`. Если
 *     OneEntry вернёт `paymentUrl` (Stripe / другой redirect-payment) —
 *     редиректим, иначе сразу переходим на `success`.
 *
 * Старый под-шаг `add_card` (ручной ввод реквизитов) удалён: Stripe
 * Checkout собирает данные карты на своей hosted-странице, отдельный
 * UI не нужен. Если в будущем появится payment-account, требующий
 * локальной формы карты — вернуть ветку обратно.
 */
const StepPayment = ({ dict }: { dict?: IAttributeValues }): JSX.Element => {
  const dispatch = useAppDispatch();
  const { onConfirmOrder, isLoading } = useCreateOrder();

  const { data, isLoading: isAccountsLoading } = useGetAccountsQuery({});
  const accounts: IAccountsEntity[] = (data ?? []).filter(
    (a) => a.isVisible !== false,
  );

  const [identifier, setIdentifier] = useState<string>('');
  const [comment, setComment] = useState('');
  const [altReceiver, setAltReceiver] = useState(false);
  const [altPhone, setAltPhone] = useState('');

  // Дефолтный выбор — первый видимый аккаунт. Делаем после прихода
  // данных, чтобы initial render не рендерил пустое состояние.
  useEffect(() => {
    if (!identifier && accounts.length > 0) {
      setIdentifier(accounts[0]!.identifier);
    }
  }, [accounts, identifier]);

  const persistOrderFields = () => {
    if (comment.trim()) {
      dispatch(
        addData({ marker: 'comment', type: 'string', value: comment.trim() }),
      );
    }
    if (altReceiver && altPhone.trim()) {
      dispatch(
        addData({ marker: 'alt_phone', type: 'string', value: altPhone.trim() }),
      );
    }
  };

  const onNext = async () => {
    if (!identifier) return;
    persistOrderFields();
    dispatch(addPaymentMethod(identifier));
    const result = await onConfirmOrder({ paymentAccountIdentifier: identifier });
    if (!result.ok) {
      dispatch(setStepError(result.error));
      return;
    }
    if (result.paymentUrl) {
      window.location.href = result.paymentUrl;
      return;
    }
    dispatch(setStep('success'));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Хедер */}
      <div className="flex items-center gap-2.5">
        <Image
          src="/images/icons/card-line.svg"
          alt=""
          width={23}
          height={15}
        />
        <p className="font-normal text-[20px] text-paper">
          {(dict?.select_payment_text?.value as string | undefined) ??
            'Payment'}
        </p>
      </div>

      {isAccountsLoading ? (
        <p className="text-paper/70">Loading payment methods…</p>
      ) : accounts.length === 0 ? (
        <p className="text-paper/70">
          No payment methods are configured. Please contact support.
        </p>
      ) : (
        accounts.map((account) => (
          <PaymentMethodOption
            key={account.id}
            account={account}
            checked={identifier === account.identifier}
            onSelect={() => setIdentifier(account.identifier)}
          />
        ))
      )}

      {/* Комментарии к заказу */}
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.currentTarget.value)}
        placeholder={
          (dict?.comment_order?.value as string | undefined) ??
          'Comments to the order'
        }
        className="text-[16px] text-paper placeholder:text-[#a8a9b5] border border-paper p-1.25 rounded-[5px] bg-transparent focus:outline-none"
      />

      {/* Заказ принимает другой человек */}
      <label className="custom-checkbox text-[14px] text-paper">
        <input
          type="checkbox"
          checked={altReceiver}
          onChange={(e) => setAltReceiver(e.currentTarget.checked)}
        />
        <span className="checkbox-box mr-2.5">
          <Image
            src="/images/icons/checkbox-mark.svg"
            alt=""
            width={18}
            height={18}
          />
        </span>
        {(dict?.another_person_text?.value as string | undefined) ??
          'The order will be taken by another person'}
      </label>

      {/* Телефон альтернативного получателя (виден, когда чекбокс включён) */}
      {altReceiver ? (
        <input
          type="tel"
          autoComplete="tel"
          value={altPhone}
          onChange={(e) => setAltPhone(e.currentTarget.value)}
          placeholder="phone number"
          className="text-[16px] text-paper placeholder:text-[#a8a9b5] border border-paper p-1.25 rounded-[5px] bg-transparent focus:outline-none"
        />
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={
          isLoading ||
          !identifier ||
          (altReceiver && !altPhone.trim())
        }
        className="cart_btn mt-3.75 mx-auto w-60 disabled:opacity-60"
      >
        {isLoading ? 'Processing...' : 'APPLY'}
      </button>
    </div>
  );
};

/**
 * Радио-карточка одного payment-аккаунта. Иконки выбираем по
 * `account.type` — это `'paypal' | 'stripe' | 'custom' | ...` из
 * OneEntry. Для `custom` (наличные и др.) иконки нет — отображается
 * только лейбл.
 */
const PaymentMethodOption = ({
  account,
  checked,
  onSelect,
}: {
  account: IAccountsEntity;
  checked: boolean;
  onSelect: () => void;
}): JSX.Element => {
  const id = `pay-${account.identifier}`;
  const label = account.localizeInfos?.title ?? account.identifier;
  const type = account.type?.toLowerCase();

  return (
    <div className="flex items-center gap-2.5 text-paper">
      <input
        type="radio"
        id={id}
        name="payment-method"
        checked={checked}
        onChange={onSelect}
        className="hidden peer"
      />
      <label
        htmlFor={id}
        className="radio-custom flex items-center cursor-pointer select-none"
      >
        <span className="ml-2 text-paper capitalize">{label}</span>
      </label>
      {type === 'paypal' ? (
        <Image
          src="/images/icons/paypal.png"
          alt="PayPal"
          width={68}
          height={18}
        />
      ) : null}
      {type === 'stripe' ? (
        <>
          <Image
            src="/images/icons/visa.png"
            alt="Visa"
            width={36}
            height={12}
          />
          <Image
            src="/images/icons/mastercart.png"
            alt="Mastercard"
            width={28}
            height={18}
          />
        </>
      ) : null}
    </div>
  );
};

export default StepPayment;
