'use client';

import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useState } from 'react';

import { useCreateOrder } from '@/app/api';
import { useAppDispatch } from '@/app/store/hooks';
import {
  addData,
  addPaymentMethod,
  setStep,
  setStepError,
} from '@/app/store/reducers/OrderSlice';
import CardLineIcon from '@/components/icons/card-line.svg';
import CheckboxMarkIcon from '@/components/icons/checkbox-mark.svg';

/**
 * Шаг checkout — выбор метода оплаты (по `cart_PAYMENT.html`).
 *
 * Рендерит: радио PayPal / cash / Credit & Debit Cards + textbox комментариев +
 * чекбокс "order taken by another person", переключающий инпут альтернативного телефона.
 * Card → sheet {@link StepAddCard} (по `cart_add_card.html`);
 * PayPal/cash → сразу на `success`.
 * @param   {object}           props      - Пропсы шага.
 * @param   {IAttributeValues} props.dict - Словарь статического контента.
 * @returns {JSX.Element}                 JSX шага.
 */
const StepPayment = ({ dict }: { dict?: IAttributeValues }): JSX.Element => {
  const dispatch = useAppDispatch();
  const { onConfirmOrder, isLoading } = useCreateOrder();
  const [method, setMethod] = useState<'cash' | 'paypal' | 'card'>('cash');
  const [comment, setComment] = useState('');
  const [altReceiver, setAltReceiver] = useState(false);
  const [altPhone, setAltPhone] = useState('');

  const persistOrderFields = () => {
    if (comment.trim()) {
      dispatch(
        addData({ marker: 'comment', type: 'string', value: comment.trim() }),
      );
    }
    if (altReceiver && altPhone.trim()) {
      dispatch(
        addData({
          marker: 'alt_phone',
          type: 'string',
          value: altPhone.trim(),
        }),
      );
    }
  };

  const onNext = async () => {
    persistOrderFields();
    if (method === 'card') {
      // Card-флоу продолжается в StepAddCard, который сам вызывает createOrder
      // после того, как пользователь выберет сохранённую карту.
      dispatch(setStep('add_card'));
      return;
    }
    dispatch(addPaymentMethod(method));
    const result = await onConfirmOrder({ paymentAccountIdentifier: method });
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
        <CardLineIcon />
        <p className="font-normal text-[20px] text-paper">
          {(dict?.select_payment_text?.value as string | undefined) ??
            'Payment'}
        </p>
      </div>

      {/* PayPal */}
      <div className="flex items-center gap-2.5 text-paper">
        <input
          type="radio"
          id="pay-paypal"
          name="payment-method"
          checked={method === 'paypal'}
          onChange={() => setMethod('paypal')}
          className="hidden peer"
        />
        <label
          htmlFor="pay-paypal"
          className="radio-custom flex items-center cursor-pointer select-none"
        >
          <span className="ml-2 text-paper">Pay with</span>
        </label>
        <Image
          src="/images/icons/paypal.png"
          alt="PayPal"
          width={68}
          height={18}
        />
      </div>

      {/* Наличные */}
      <div className="flex items-center gap-2.5 text-paper">
        <input
          type="radio"
          id="pay-cash"
          name="payment-method"
          checked={method === 'cash'}
          onChange={() => setMethod('cash')}
          className="hidden peer"
        />
        <label
          htmlFor="pay-cash"
          className="radio-custom flex items-center cursor-pointer select-none"
        >
          <span className="ml-2 text-paper">
            {(dict?.pay_cash_text?.value as string | undefined) ??
              'Pay with cash'}
          </span>
        </label>
      </div>

      {/* Кредитные и дебетовые карты */}
      <div className="flex items-center gap-2.5 text-paper">
        <input
          type="radio"
          id="pay-card"
          name="payment-method"
          checked={method === 'card'}
          onChange={() => setMethod('card')}
          className="hidden peer"
        />
        <label
          htmlFor="pay-card"
          className="radio-custom flex items-center cursor-pointer select-none"
        >
          <span className="ml-2 text-paper">Credit &amp; Debit Cards</span>
        </label>
        <Image src="/images/icons/visa.png" alt="Visa" width={36} height={12} />
        <Image
          src="/images/icons/mastercart.png"
          alt="Mastercard"
          width={28}
          height={18}
        />
      </div>

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
          <CheckboxMarkIcon />
        </span>
        The order will be taken by another person
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
        disabled={isLoading || (altReceiver && !altPhone.trim())}
        className="cart_btn mt-3.75 mx-auto w-60 disabled:opacity-60"
      >
        {isLoading ? 'Processing...' : 'APPLY'}
      </button>
    </div>
  );
};

export default StepPayment;
