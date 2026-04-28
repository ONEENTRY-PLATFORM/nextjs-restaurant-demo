'use client';

import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import {
  addData,
  addPaymentMethod,
  setStep,
} from '@/app/store/reducers/OrderSlice';
import CardLineIcon from '@/components/icons/card-line.svg';
import CheckboxMarkIcon from '@/components/icons/checkbox-mark.svg';

/**
 * Checkout step — choose payment method (per `cart_PAYMENT.html`).
 *
 * Renders: PayPal / cash / Credit & Debit Cards radios + comments textbox +
 * "order taken by another person" checkbox toggling an alt-phone input.
 * Card → {@link StepAddCard} sheet (per `cart_add_card.html`);
 * PayPal/cash → straight to `success`.
 * @param   {object}           props      - Step props.
 * @param   {IAttributeValues} props.dict - Static-content dictionary.
 * @returns {JSX.Element}                 Step JSX.
 */
const StepPayment = ({ dict }: { dict?: IAttributeValues }): JSX.Element => {
  const dispatch = useAppDispatch();
  const [method, setMethod] = useState<'cash' | 'paypal' | 'card'>('cash');
  const [comment, setComment] = useState('');
  const [altReceiver, setAltReceiver] = useState(false);
  const [altPhone, setAltPhone] = useState('');

  const persistOrderFields = () => {
    if (comment.trim()) {
      dispatch(addData({ marker: 'comment', value: comment.trim() }));
    }
    if (altReceiver && altPhone.trim()) {
      dispatch(addData({ marker: 'alt_phone', value: altPhone.trim() }));
    }
  };

  const onNext = () => {
    persistOrderFields();
    if (method === 'card') {
      dispatch(setStep('add_card'));
      return;
    }
    dispatch(addPaymentMethod(method));
    dispatch(setStep('success'));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
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

      {/* Cash */}
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

      {/* Credit & Debit Cards */}
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

      {/* Comments to the order */}
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

      {/* Order taken by another person */}
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

      {/* Alt-receiver phone (visible when checkbox is on) */}
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
        disabled={altReceiver && !altPhone.trim()}
        className="cart_btn mt-3.75 mx-auto w-60 disabled:opacity-60"
      >
        APPLY
      </button>
    </div>
  );
};

export default StepPayment;
