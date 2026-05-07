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
 * Форматирует дату как `dd.MM.yy HH.mm` — совпадает с форматированием
 * `Get delivery by: 28.02.24 15.30` из `cart_PAYMENT_masseges.html`.
 * @param   {Date}   d - Дата для форматирования.
 * @returns {string}   Отформатированная строка.
 */
const formatDeliveryStamp = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(
    2
  )} ${pad(d.getHours())}.${pad(d.getMinutes())}`;
};

/**
 * Шаг checkout — экран success / error сообщения.
 *
 * Вариант success (`cart_PAYMENT_masseges.html`):
 *   - Номер заказа (оранжевый, сверху) + сводка товаров
 *   - Штамп "Get delivery by: <date>"
 *   - Горизонтальный разделитель
 *   - Заголовок "Order Confirmed" + текст подтверждения + "See you soon!"
 *
 * Вариант error (`cart_error_masseges.html`):
 *   - Две центрированные строки: "Something went wrong." + "Please try again."
 * @param   {object}              props         - Пропсы компонента.
 * @param   {'success' | 'error'} props.variant - Какой экран рендерить.
 * @returns {JSX.Element}                       JSX шага.
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
  // Захватываем нечистый `Date.now()` один раз в initial state, чтобы рендер оставался
  // чистым, а штамп — стабильным на всё время жизни компонента. Номер заказа
  // приходит из id, присвоенного CMS в момент подтверждения.
  const orderNumber = lastOrderId ? '№' + lastOrderId : '';
  const [deliveryStamp] = useState(() =>
    formatDeliveryStamp(new Date(Date.now() + 45 * 60 * 1000))
  );

  if (variant === 'success') {
    return (
      <div className="flex flex-col gap-6.25">
        {/* Номер заказа */}
        <div className="mx-auto font-medium text-[20px] text-brand">{orderNumber}</div>

        {/* Товары */}
        {cartData
          .filter(entry => entry.product && entry.product.id)
          .slice(0, 5)
          .map(entry => {
            const title = entry.product?.localizeInfos?.title ?? 'Item';
            const qty = entry.quantity ?? 1;
            return (
              <div key={entry.id} className="flex items-center justify-between gap-3">
                <p className="max-w-42.5 font-normal text-[16px] text-white opacity-90">{title}</p>
                <div className="rounded-[5px] border border-white px-2 py-1.5 text-[16px] text-brand">
                  x{qty}
                </div>
              </div>
            );
          })}

        {/* Штамп доставки */}
        <p className="mt-6.25 text-center font-normal text-[16px] text-brand">
          Get delivery by: {deliveryStamp}
        </p>

        {/* Разделитель */}
        <div className="mx-auto mt-6.25 h-px w-56.25 bg-brand" />

        {/* Заголовки */}
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
