'use client';

import { useTransitionRouter } from 'next-transition-router';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import PaymentButton from '@/components/layout/cart/components/PaymentButton';
import TotalAmount from '@/components/layout/cart/components/TotalAmount';
import DeliveryTable from '@/components/layout/cart/delivery-table/DeliveryTable';

/**
 * Delivery form
 */
const DeliveryForm = ({
  dict,
  deliveryData,
}: {
  dict: IAttributeValues;
  deliveryData: IProductsEntity;
}): JSX.Element => {
  const router = useTransitionRouter();

  return (
    <form
      className="flex w-182.5 max-w-full flex-col pb-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push('/payment');
      }}
    >
      <DeliveryTable dict={dict} delivery={deliveryData as IProductsEntity} />
      <div id="total" className="mt-4 flex w-full flex-col">
        <TotalAmount
          dict={dict}
          className="flex self-center text-lg font-bold leading-6 text-white lg:self-end"
        />
        <PaymentButton
          text={
            (dict.go_to_pay_placeholder?.value as string) ?? 'Go to payment'
          }
          className="self-end max-lg:self-center"
        />
      </div>
    </form>
  );
};

export default DeliveryForm;
