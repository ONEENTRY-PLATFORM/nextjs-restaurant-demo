'use client';

import Image from 'next/image';
import type { JSX } from 'react';

import { getProductCurrency, getProductImageUrl } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import type { OrderLineItem } from '@/components/cart/steps/stepOrderUtils';
import Placeholder from '@/components/shared/Placeholder';
import { UsePrice } from '@/components/utils';

type OrderItemsListProps = {
  items: OrderLineItem[];
  displayCurrency?: string | undefined;
};

/**
 * OrderItemsList — selected cart lines (image + title + weight + unit price + quantity).
 *
 * @param   {OrderItemsListProps}     props                 - Component props.
 * @param   {OrderLineItem[]}         props.items           - Billable order lines.
 * @param   {string}                  [props.displayCurrency] - Currency from the server preview (falls back per-product).
 * @returns JSX of the order items list.
 */
const OrderItemsList = ({ items, displayCurrency }: OrderItemsListProps): JSX.Element => {
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      {items.map(({ entry, product }) => {
        const title = product.localizeInfos?.title ?? t('item_fallback_text', 'Item');
        const weight = product.attributeValues?.weight?.value as string | number | undefined;
        const unit = product.price ?? 0;
        const imgSrc = getProductImageUrl(product.attributeValues);
        return (
          <div key={entry.id} className="step-order-row flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-4">
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
              <div className="flex min-w-0 flex-col justify-between gap-1">
                <p className="text-sm font-normal text-white">{title}</p>
                <div className="flex items-center gap-2.5">
                  {weight ? <p className="text-sm font-normal text-white">{weight} g</p> : null}
                  <p className="text-xl font-bold text-brand">
                    {UsePrice({
                      amount: unit,
                      currency: displayCurrency ?? getProductCurrency(product.attributeValues),
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex h-11.25 w-8.75 shrink-0 items-center justify-center rounded-card border border-white text-base font-normal text-brand">
              x{entry.quantity ?? 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderItemsList;
