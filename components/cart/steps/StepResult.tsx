'use client';

import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import {
  removeOrder,
  resetCheckout,
  selectCheckoutStepError,
  selectLastOrderId,
  setStep,
} from '@/app/store/reducers/OrderSlice';

/**
 * formatDeliveryStamp — formats a date as `dd.MM.yy HH.mm` (for the "Get delivery by: …" stamp).
 *
 * @param   {Date}   d - Date to format.
 * @returns Formatted stamp string.
 */
const formatDeliveryStamp = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(
    2
  )} ${pad(d.getHours())}.${pad(d.getMinutes())}`;
};

/**
 * StepResult — final wizard screen: success or error.
 *
 * @param   {object}                   props         - Component props.
 * @param   {'success' | 'error'}      props.variant - Which screen to render.
 * @returns JSX of the success or error screen.
 */
const StepResult = ({ variant }: { variant: 'success' | 'error' }): JSX.Element => {
  const dispatch = useAppDispatch();
  const stepError = useAppSelector(selectCheckoutStepError);
  const lastOrderId = useAppSelector(selectLastOrderId);
  const cartData = useAppSelector(selectCartData) as Array<{
    id: number;
    quantity?: number;
    product?: IProductsEntity;
  }>;
  // Capture `Date.now()` in the initial state - render stays pure, the stamp is stable for the lifetime of the component.
  const orderNumber = lastOrderId ? '–' + lastOrderId : '';
  const [deliveryStamp] = useState(() =>
    formatDeliveryStamp(new Date(Date.now() + 45 * 60 * 1000))
  );

  if (variant === 'success') {
    return (
      <div className="flex flex-col gap-6.25">
        {/* Order number */}
        <div className="mx-auto font-medium text-xl text-brand">{orderNumber}</div>

        {/* Items */}
        {cartData
          .filter(entry => entry.product && entry.product.id)
          .slice(0, 5)
          .map(entry => {
            const title = entry.product?.localizeInfos?.title ?? 'Item';
            const qty = entry.quantity ?? 1;
            return (
              <div key={entry.id} className="flex items-center justify-between gap-3">
                <p className="max-w-42.5 font-normal text-base text-white opacity-90">{title}</p>
                <div className="rounded-card border border-white px-2 py-1.5 text-base text-brand">
                  x{qty}
                </div>
              </div>
            );
          })}

        {/* Delivery stamp */}
        <p className="mt-6.25 text-center font-normal text-base text-brand">
          Get delivery by: {deliveryStamp}
        </p>

        {/* Divider */}
        <div className="mx-auto mt-6.25 h-px w-56.25 bg-brand" />

        {/* Headings */}
        <p className="text-center font-semibold text-[27px] text-brand">Order Confirmed</p>
        <p className="text-center font-light text-[18px] text-paper">
          Your order has been placed successfully
        </p>
        <p className="text-center font-normal text-[23px] text-brand">See you soon!</p>

        {/* CTA */}
        <Link
          href="/profile/orders"
          onClick={() => {
            dispatch(removeOrder());
            dispatch(resetCheckout());
          }}
          className="cart_btn mt-4"
        >
          View my orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6.25 py-10 px-2.5">
      <p className="text-center font-light text-[32px] text-white opacity-90">
        Something went wrong.
      </p>
      <p className="text-center font-light text-[32px] text-brand opacity-90">Please try again.</p>
      {stepError ? <p className="text-center text-sm text-paper/70">{stepError}</p> : null}
      <button type="button" onClick={() => dispatch(setStep('cart'))} className="cart_btn mt-4">
        Back to cart
      </button>
    </div>
  );
};

export default StepResult;
