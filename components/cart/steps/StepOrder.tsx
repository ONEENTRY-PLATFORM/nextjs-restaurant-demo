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
 * Checkout step — order review (per `cart_Order.html`).
 *
 * Item list (image + title + weight/price + qty pill) + promo code field +
 * subtotal/delivery/total summary + APPLY button → `payment`.
 * @param   {object}           props      - Step props.
 * @param   {IAttributeValues} props.dict - Static-content dictionary.
 * @returns {JSX.Element}                 Step JSX.
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
      {/* Items */}
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

      {/* Promo code */}
      <div className="mt-12 flex justify-between rounded-[5px] border border-brand p-2.5">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.currentTarget.value)}
          placeholder="Promo Code"
          className="flex-1 border-none bg-transparent font-normal text-[16px] text-white placeholder:text-white/60 focus:outline-none"
        />
        <button
          type="button"
          className="rounded-[5px] border-none bg-brand px-2.5 text-[14px] font-normal text-black hover_btn_transp"
        >
          Apply Code
        </button>
      </div>

      {/* Totals */}
      <div className="rounded-[5px] border border-brand p-2.5">
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
        className="cart_btn mt-10"
      >
        APPLY
      </button>
    </div>
  );
};

export default StepOrder;
