'use client';

import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { setStep } from '@/app/store/reducers/OrderSlice';
import PaymentButton from '@/components/layout/cart/components/PaymentButton';
import TotalAmount from '@/components/layout/cart/components/TotalAmount';
import DeliveryTable from '@/components/layout/cart/delivery-table/DeliveryTable';

/**
 * DeliveryForm — delivery wizard step: delivery table + total + "Go to payment" CTA.
 *
 * @param   {object}            props              - Component props.
 * @param   {IProductsEntity}   props.deliveryData - OneEntry product representing the delivery service line item.
 * @returns JSX of the delivery form.
 */
const DeliveryForm = ({ deliveryData }: { deliveryData: IProductsEntity }): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();

  return (
    <form
      className="flex w-182.5 max-w-full flex-col pb-5"
      onSubmit={e => {
        e.preventDefault();
        dispatch(setStep('order'));
      }}
    >
      <DeliveryTable delivery={deliveryData as IProductsEntity} />
      <div id="total" className="mt-4 flex w-full flex-col">
        <TotalAmount className="flex self-center text-lg leading-6 font-bold text-white lg:self-end" />
        <PaymentButton text={t('go_to_pay_placeholder', 'Go to payment')} />
      </div>
    </form>
  );
};

export default DeliveryForm;
