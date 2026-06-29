import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';

import { formatDate } from '@/app/utils/formatDate';

import { formatOrderNumber, statusLabel } from './bookingUtils';

/**
 * HistoryBookingCard — read-only past booking row (number / status / date).
 *
 * @param   {object}                 props       - Component props.
 * @param   {IOrderByMarkerEntity}   props.order - OneEntry booking order entity.
 * @returns JSX of the history booking row.
 */
const HistoryBookingCard = ({ order }: { order: IOrderByMarkerEntity }): JSX.Element => {
  const dateRaw = (order.createdDate ??
    (order as unknown as { formattedCreated?: string }).formattedCreated ??
    '') as string;
  const date = dateRaw ? formatDate(dateRaw) : '';
  return (
    <div className="profile-anim-row flex items-center justify-between rounded-card border border-paper px-3.75 py-1.25">
      <p className="text-base font-bold text-paper">№{formatOrderNumber(order)}</p>
      <p className="text-base font-normal text-paper">{statusLabel(order)}</p>
      <p className="text-base font-normal text-paper">{date}</p>
    </div>
  );
};

export default HistoryBookingCard;
