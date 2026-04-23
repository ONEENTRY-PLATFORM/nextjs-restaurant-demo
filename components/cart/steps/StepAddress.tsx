'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectDeliveryData,
  setDeliveryData,
} from '@/app/store/reducers/CartSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';

/**
 * Checkout step — delivery address input (per `cart_Order.html` address row).
 * Advances to `payment` on submit.
 * @returns {JSX.Element} Step JSX.
 */
const StepAddress = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const delivery = useAppSelector(selectDeliveryData);
  const [address, setAddress] = useState(
    (delivery?.address as string | undefined) ?? '',
  );

  const onNext = () => {
    dispatch(setDeliveryData({ ...delivery, address }));
    dispatch(setStep('payment'));
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center font-bold text-[20px] uppercase text-brand">
        Delivery address
      </h2>
      <label className="flex flex-col gap-1 border-b border-b-[#b0bcce]">
        <span className="cart_label">Address</span>
        <input
          type="text"
          className="cart_input"
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
          placeholder="Street, apartment, floor..."
        />
      </label>
      <button
        type="button"
        onClick={onNext}
        disabled={!address.trim()}
        className="cart_btn disabled:opacity-60"
      >
        Continue
      </button>
    </div>
  );
};

export default StepAddress;
