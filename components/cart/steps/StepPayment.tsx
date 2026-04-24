'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addPaymentMethod, setStep } from '@/app/store/reducers/OrderSlice';

/**
 * Checkout step — choose payment method (per `cart_PAYMENT.html`).
 * Card payment is disabled for now (OneEntry `card` payment account не настроен).
 * Renders: PayPal / cash radios — оба ведут на `success`.
 * @returns {JSX.Element} Step JSX.
 */
const StepPayment = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [method, setMethod] = useState<'cash' | 'paypal'>('cash');

  const onNext = () => {
    dispatch(addPaymentMethod(method));
    dispatch(setStep('success'));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-[10px]">
        <svg
          width="23"
          height="15"
          viewBox="0 0 23 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M22 4.71429V12.1429C22 12.6354 21.7918 13.1078 21.4211 13.4561C21.0504 13.8043 20.5477 14 20.0235 14H2.97647C2.45228 14 1.94955 13.8043 1.57889 13.4561C1.20823 13.1078 1 12.6354 1 12.1429V2.85714C1 2.3646 1.20823 1.89223 1.57889 1.54394C1.94955 1.19566 2.45228 1 2.97647 1H20.0235C20.5477 1 21.0504 1.19566 21.4211 1.54394C21.7918 1.89223 22 2.3646 22 2.85714V4.71429ZM22 4.71429H7.42353"
            stroke="#DFE9F9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="font-normal text-[20px] text-paper">Payment</p>
      </div>

      {/* PayPal */}
      <div className="flex items-center gap-[10px] text-paper">
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
      <div className="flex items-center gap-[10px] text-paper">
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

      <button type="button" onClick={onNext} className="cart_btn">
        Continue
      </button>
    </div>
  );
};

export default StepPayment;
