'use client';

import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

import { formatBookingWhen, formatOrderNumber, statusLabel } from './bookingUtils';

/**
 * ActiveBookingCard — active booking row with Cancel / Edit actions.
 *
 * @param   {object}                 props          - Component props.
 * @param   {IOrderByMarkerEntity}   props.order    - OneEntry booking order entity.
 * @param   {() => void}             props.onCancel - Cancellation handler.
 * @param   {() => void}             props.onEdit   - Edit handler that opens the reservation popup.
 * @returns JSX of the active booking row.
 */
const ActiveBookingCard = ({
  order,
  onCancel,
  onEdit,
}: {
  order: IOrderByMarkerEntity;
  onCancel: () => void;
  onEdit: () => void;
}): JSX.Element => {
  const t = useT();
  const when = formatBookingWhen(order);

  return (
    <div className="profile-anim-row flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-card border border-brand px-3.75 py-1.25">
        <p className="text-base font-bold text-paper">№{formatOrderNumber(order)}</p>
        <p className="text-base font-normal text-paper">{statusLabel(order)}</p>
        <p className="text-base font-normal text-paper">{when}</p>
      </div>
      <div className="flex items-center justify-between gap-3.75">
        <button
          type="button"
          onClick={onCancel}
          className="hover_btn_paper flex h-8.75 w-23.75 items-center justify-center rounded-card border border-paper text-base text-paper"
        >
          {t('cancel_reservation_button', 'Cancel')}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="hover_btn_brand flex h-8.75 w-23.75 items-center justify-center rounded-card border border-brand text-base text-brand"
        >
          {t('edit_reservation_button', 'Edit')}
        </button>
      </div>
    </div>
  );
};

export default ActiveBookingCard;
