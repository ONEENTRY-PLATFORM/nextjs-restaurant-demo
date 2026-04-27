'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addPaymentMethod, setStep } from '@/app/store/reducers/OrderSlice';
import CardLineIcon from '@/components/icons/card-line.svg';

/**
 * Checkout step — choose payment method (per `cart_PAYMENT.html`).
 * Renders: PayPal / cash / card radios. Card → {@link StepAddCard} sheet
 * (per `cart_add_card.html`); PayPal/cash → straight to `success`.
 * @returns {JSX.Element} Step JSX.
 */
const StepPayment = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [method, setMethod] = useState<'cash' | 'paypal' | 'card'>('cash');

  const onNext = () => {
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
        <p className="font-normal text-[20px] text-paper">Payment</p>
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
          <span className="ml-2 text-paper">Cash on delivery</span>
        </label>
      </div>

      {/* Card */}
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
          <span className="ml-2 text-paper">Card</span>
        </label>
      </div>

      <button type="button" onClick={onNext} className="cart_btn">
        Continue
      </button>
    </div>
  );
};

export default StepPayment;
