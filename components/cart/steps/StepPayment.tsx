'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addPaymentMethod, setStep } from '@/app/store/reducers/OrderSlice';

const METHODS: Array<{ id: string; label: string }> = [
  { id: 'cash', label: 'Cash on delivery' },
  { id: 'card', label: 'Credit / debit card' },
];

/**
 * Checkout step — choose payment method (per `cart_PAYMENT.html`).
 * For `card` routes to `add_card` step, for `cash` routes to `success`.
 * @returns {JSX.Element} Step JSX.
 */
const StepPayment = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState('');

  const onNext = () => {
    if (!selected) return;
    dispatch(addPaymentMethod(selected));
    if (selected === 'card') {
      dispatch(setStep('add_card'));
    } else {
      dispatch(setStep('success'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center font-bold text-[20px] uppercase text-brand">
        Payment method
      </h2>
      <div className="flex flex-col gap-3">
        {METHODS.map((m) => (
          <label
            key={m.id}
            className={
              'flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 transition-colors ' +
              (selected === m.id
                ? 'border-brand text-brand'
                : 'border-muted text-paper hover:border-brand')
            }
          >
            <input
              type="radio"
              name="payment_method"
              value={m.id}
              checked={selected === m.id}
              onChange={() => setSelected(m.id)}
            />
            <span className="radio-custom" />
            <span>{m.label}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!selected}
        className="cart_btn disabled:opacity-60"
      >
        Continue
      </button>
    </div>
  );
};

export default StepPayment;
