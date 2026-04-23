'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { setStep } from '@/app/store/reducers/OrderSlice';

/**
 * Checkout step — add credit card form (per `cart_add_card.html`).
 *
 * Visual-only form; actual tokenization should be integrated with the
 * configured payment provider (Stripe, PayPal, etc.) — left as an extension
 * point. Here we just collect input and advance to `success`.
 * @returns {JSX.Element} Step JSX.
 */
const StepAddCard = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState('');

  const ready =
    number.replace(/\s+/g, '').length >= 12 &&
    /^\d\d\/\d\d$/.test(expiry) &&
    cvc.length >= 3 &&
    holder.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center font-bold text-[20px] uppercase text-brand">
        Add card
      </h2>

      <label className="flex flex-col gap-1 border-b border-b-[#b0bcce]">
        <span className="cart_label">Card number</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          className="cart_input tracking-widest"
          value={number}
          onChange={(e) => setNumber(e.currentTarget.value)}
          placeholder="0000 0000 0000 0000"
        />
      </label>

      <div className="flex gap-[15px]">
        <label className="flex flex-1 flex-col gap-1 border-b border-b-[#b0bcce]">
          <span className="cart_label">Expiry (MM/YY)</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            className="cart_input"
            value={expiry}
            onChange={(e) => setExpiry(e.currentTarget.value)}
            placeholder="MM/YY"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 border-b border-b-[#b0bcce]">
          <span className="cart_label">CVC</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            className="cart_input"
            value={cvc}
            onChange={(e) => setCvc(e.currentTarget.value)}
            placeholder="***"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 border-b border-b-[#b0bcce]">
        <span className="cart_label">Cardholder name</span>
        <input
          type="text"
          autoComplete="cc-name"
          className="cart_input uppercase"
          value={holder}
          onChange={(e) => setHolder(e.currentTarget.value)}
        />
      </label>

      <button
        type="button"
        onClick={() => dispatch(setStep('success'))}
        disabled={!ready}
        className="cart_btn disabled:opacity-60"
      >
        Pay
      </button>
    </div>
  );
};

export default StepAddCard;
