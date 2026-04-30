'use client';

import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';
import Placeholder from '@/components/shared/Placeholder';
import { UsePrice } from '@/components/utils';

type CartEntry = {
  id: number;
  quantity?: number;
  selected?: boolean;
};

/**
 * Шаг checkout — обзор заказа (по `cart_Order.html`).
 *
 * Список товаров (картинка + название + вес/цена + плашка количества) + поле промо-кода +
 * сводка subtotal/delivery/total + кнопка APPLY → `payment`.
 * @param   {object}           props      - Пропсы шага.
 * @param   {IAttributeValues} props.dict - Словарь статического контента.
 * @returns {JSX.Element}                 JSX шага.
 */
const StepOrder = ({ dict }: { dict: IAttributeValues }): JSX.Element => {
  const dispatch = useAppDispatch();
  const cartData = useAppSelector(selectCartData) as CartEntry[];
  const products = useAppSelector(
    (state) => state.cartReducer.products,
  ) as IProductsEntity[];
  const deliveryPrice = useAppSelector(
    (state) => state.cartReducer.delivery?.price ?? 0,
  );

  const [promoCode, setPromoCode] = useState('');

  const items = cartData
    .map((entry) => ({
      entry,
      product: products.find((p) => p.id === entry.id),
    }))
    .filter((row) => row.product) as Array<{
    entry: CartEntry;
    product: IProductsEntity;
  }>;

  const subtotal = items.reduce((sum, { entry, product }) => {
    const sale = product.attributeValues?.sale?.value as number | undefined;
    const price = product.price ?? 0;
    const unit = sale && sale > 0 ? sale : price;
    return sum + unit * (entry.quantity ?? 1);
  }, 0);
  const total = subtotal + deliveryPrice;

  return (
    <div className="flex flex-col gap-5">
      {/* Товары */}
      <div className="flex flex-col gap-5">
        {items.map(({ entry, product }) => {
          const title = product.localizeInfos?.title ?? 'Item';
          const weight = product.attributeValues?.weight?.value as
            | string
            | number
            | undefined;
          const sale = product.attributeValues?.sale?.value as
            | number
            | undefined;
          const price = product.price ?? 0;
          const unit = sale && sale > 0 ? sale : price;
          const cover = product.attributeValues?.cover?.value as
            | { downloadLink?: string }
            | undefined;
          const imgSrc = cover?.downloadLink;
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2.5"
            >
              <div className="relative size-17.25 shrink-0 overflow-hidden rounded">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={title}
                    width={69}
                    height={69}
                    className="size-full object-cover"
                  />
                ) : (
                  <Placeholder />
                )}
              </div>
              <div className="flex w-50 flex-col justify-between gap-1">
                <p className="font-normal text-[14px] text-white">{title}</p>
                <div className="flex items-center gap-2.5">
                  {weight ? (
                    <p className="font-normal text-[14px] text-white">
                      {weight} g
                    </p>
                  ) : null}
                  <p className="font-bold text-[20px] text-brand">
                    {UsePrice({ amount: unit })}
                  </p>
                </div>
              </div>
              <div className="flex h-11.25 w-8.75 items-center justify-center rounded-[5px] border border-white text-[16px] font-normal text-brand">
                x{entry.quantity ?? 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Промо-код — отдельный инпут + кнопка, по pk_order.html */}
      <div className="mt-5 flex w-full items-center justify-between gap-6.25">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.currentTarget.value)}
          placeholder="Promo Code"
          className="h-8 w-2/3 rounded-[5px] border border-brand bg-transparent text-center text-[16px] uppercase text-white placeholder:text-center placeholder:text-[16px] placeholder:uppercase placeholder:text-white focus:outline-none"
        />
        <button
          type="button"
          className="h-8 w-1/3 rounded-[5px] border-none bg-brand px-2.5 text-[13px] font-normal uppercase text-black hover_btn_transp lg:text-[14px]"
        >
          Apply Code
        </button>
      </div>

      {/* Итоги */}
      <div className="mt-10 rounded-[5px] border border-brand p-2.5">
        <div className="flex gap-1.25 text-white">
          <p>
            {(dict?.subtotal_text?.value as string | undefined) ?? 'Subtotal'}:
          </p>
          <p>{UsePrice({ amount: subtotal })}</p>
        </div>
        <div className="flex gap-1.25 text-brand">
          <p>
            {(dict?.delivery_text?.value as string | undefined) ?? 'Delivery'}:
          </p>
          <p>{UsePrice({ amount: deliveryPrice })}</p>
        </div>
        <div className="flex gap-1.25 text-white">
          <p>
            {(dict?.total_amount_text?.value as string | undefined) ??
              'Total Amount'}
            :
          </p>
          <p>{UsePrice({ amount: total })}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => dispatch(setStep('payment'))}
        className="mx-auto mt-7.5 flex w-full items-center justify-center rounded-[10px] bg-custom_btnorange py-2.5 text-center font-normal text-[16px] text-white hover_btn_transp"
      >
        APPLY
      </button>
    </div>
  );
};

export default StepOrder;
