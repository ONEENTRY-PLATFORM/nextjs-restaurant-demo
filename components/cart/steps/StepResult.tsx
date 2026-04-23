'use client';

import Link from 'next/link';
import type { JSX } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  removeOrder,
  selectCheckoutStepError,
  setStep,
} from '@/app/store/reducers/OrderSlice';

/**
 * Checkout step — success / error message screen
 * (per `cart_PAYMENT_masseges.html` + `cart_error_masseges.html`).
 * @param   {object}              props         - Component props.
 * @param   {'success' | 'error'} props.variant - Which screen to render.
 * @returns {JSX.Element}                       Step JSX.
 */
const StepResult = ({
  variant,
}: {
  variant: 'success' | 'error';
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const stepError = useAppSelector(selectCheckoutStepError);

  if (variant === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="font-bold text-[24px] uppercase text-brand">
          Payment successful!
        </h2>
        <p className="text-paper/90">
          Thank you for your order. We will start preparing it shortly.
        </p>
        <Link
          href="/profile/orders"
          onClick={() => dispatch(removeOrder())}
          className="cart_btn"
        >
          View my orders
        </Link>
        <Link href="/" className="text-brand underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="font-bold text-[24px] uppercase text-brand">
        Something went wrong
      </h2>
      <p className="text-paper/90">
        {stepError ?? 'Please try again in a few minutes.'}
      </p>
      <button
        type="button"
        onClick={() => dispatch(setStep('cart'))}
        className="cart_btn"
      >
        Back to cart
      </button>
    </div>
  );
};

export default StepResult;
