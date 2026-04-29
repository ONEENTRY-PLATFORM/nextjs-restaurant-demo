'use client';

import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import {
  removeOrder,
  selectCheckoutStepError,
  selectLastOrderId,
  setStep,
} from '@/app/store/reducers/OrderSlice';

/**
 * Format a date as `dd.MM.yy HH.mm` — matches `cart_PAYMENT_masseges.html`
 * `Get delivery by: 28.02.24 15.30` formatting.
 * @param   {Date}   d - Date to format.
 * @returns {string}   Formatted string.
 */
const formatDeliveryStamp = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(
    d.getFullYear(),
  ).slice(2)} ${pad(d.getHours())}.${pad(d.getMinutes())}`;
};

/**
 * Checkout step — success / error message screen.
 *
 * Success variant (`cart_PAYMENT_masseges.html`):
 *   - Order number (orange, top) + summary of items
 *   - "Get delivery by: <date>" stamp
 *   - Horizontal divider
 *   - "Order Confirmed" heading + confirmation copy + "See you soon!"
 *
 * Error variant (`cart_error_masseges.html`):
 *   - Two centered lines: "Something went wrong." + "Please try again."
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
  const lastOrderId = useAppSelector(selectLastOrderId);
  const cartData = useAppSelector(selectCartData) as Array<{
    id: number;
    quantity?: number;
    product?: IProductsEntity;
  }>;
  // Capture impure `Date.now()` once into initial state so render stays
  // pure and the stamp is stable for the component lifetime. Order number
  // comes from the CMS-assigned id captured at confirm time.
  const orderNumber = lastOrderId ? '№' + lastOrderId : '';
  const [deliveryStamp] = useState(() =>
    formatDeliveryStamp(new Date(Date.now() + 45 * 60 * 1000)),
  );

  if (variant === 'success') {
    return (
      <div className="flex flex-col gap-[25px]">
        {/* Order number */}
        <div className="mx-auto font-medium text-[20px] text-brand">
          {orderNumber}
        </div>

        {/* Items */}
        {cartData
          .filter((entry) => entry.product && entry.product.id)
          .slice(0, 5)
          .map((entry) => {
            const title = entry.product?.localizeInfos?.title ?? 'Item';
            const qty = entry.quantity ?? 1;
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3"
              >
                <p className="max-w-[170px] font-normal text-[16px] text-white opacity-90">
                  {title}
                </p>
                <div className="rounded-[5px] border border-white px-2 py-1.5 text-[16px] text-brand">
                  x{qty}
                </div>
              </div>
            );
          })}

        {/* Delivery stamp */}
        <p className="mt-[25px] text-center font-normal text-[16px] text-brand">
          Get delivery by: {deliveryStamp}
        </p>

        {/* Divider */}
        <div className="mx-auto mt-[25px] h-px w-[225px] bg-brand" />

        {/* Headings */}
        <p className="text-center font-semibold text-[27px] text-brand">
          Order Confirmed
        </p>
        <p className="text-center font-light text-[18px] text-paper">
          Your order has been placed successfully
        </p>
        <p className="text-center font-normal text-[23px] text-brand">
          See you soon!
        </p>

        {/* CTA */}
        <Link
          href="/profile/orders"
          onClick={() => dispatch(removeOrder())}
          className="cart_btn mt-4"
        >
          View my orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-[25px] py-[40px] px-[10px]">
      <p className="text-center font-light text-[32px] text-white opacity-90">
        Something went wrong.
      </p>
      <p className="text-center font-light text-[32px] text-brand opacity-90">
        Please try again.
      </p>
      {stepError ? (
        <p className="text-center text-sm text-paper/70">{stepError}</p>
      ) : null}
      <button
        type="button"
        onClick={() => dispatch(setStep('cart'))}
        className="cart_btn mt-4"
      >
        Back to cart
      </button>
    </div>
  );
};

export default StepResult;
