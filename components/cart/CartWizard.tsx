'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectCheckoutStep, setStep } from '@/app/store/reducers/OrderSlice';
import CartPage from '@/components/layout/cart';

import StepAddCard from './steps/StepAddCard';
import StepAddress from './steps/StepAddress';
import StepPayment from './steps/StepPayment';
import StepResult from './steps/StepResult';
import StepSignIn from './steps/StepSignIn';
import StepTime from './steps/StepTime';

type CartWizardProps = {
  dict: IAttributeValues;
  deliveryData: IProductsEntity;
};

/**
 * CartWizard — multi-step checkout driven by `orderReducer.step`.
 *
 * Flow:
 * `cart` → `time` → `signin` (auto-skip if authed) → `address` → `payment`
 *   → `add_card` (only for card) → `success` | `error`
 *
 * The initial `cart` step reuses the existing {@link CartPage} and mounts
 * a "Checkout" CTA that moves to the wizard.
 * @param   {CartWizardProps} props - Wizard props.
 * @returns {JSX.Element}           Wizard JSX for the current step.
 */
const CartWizard = ({ dict, deliveryData }: CartWizardProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const step = useAppSelector(selectCheckoutStep);

  if (step === 'cart') {
    return (
      <div className="flex flex-col gap-4">
        <CartPage dict={dict} deliveryData={deliveryData} />
        <button
          type="button"
          onClick={() => dispatch(setStep('time'))}
          className="cart_btn"
        >
          Proceed to checkout
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[393px] flex-col gap-6 px-[20px] md:max-w-107.5 md:px-0">
      <button
        type="button"
        onClick={() => dispatch(setStep('cart'))}
        className="self-start text-sm text-paper/70 hover:text-brand"
      >
        ← Back to cart
      </button>

      {step === 'time' && <StepTime />}
      {step === 'signin' && <StepSignIn />}
      {step === 'address' && <StepAddress />}
      {step === 'payment' && <StepPayment />}
      {step === 'add_card' && <StepAddCard />}
      {step === 'success' && <StepResult variant="success" />}
      {step === 'error' && <StepResult variant="error" />}
    </div>
  );
};

export default CartWizard;
