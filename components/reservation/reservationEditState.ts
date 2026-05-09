import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

/**
 * Сторонний канал передачи pending-edit между BookingsPopup и ReservationPopup.
 * Module-level переменная: данные нужны только на время одного перехода между попапами.
 */
type PendingReservationEdit = {
  orderId: number;
  formData: IOrdersFormData[];
  paymentAccountIdentifier: string;
  formIdentifier: string;
};

let pending: PendingReservationEdit | null = null;

/**
 * Сохраняет pending-edit перед открытием ReservationPopup в режиме редактирования.
 *
 * @param   {PendingReservationEdit | null} next - Данные для редактирования или null.
 * @returns {void}
 */
export const setPendingReservationEdit = (next: PendingReservationEdit | null): void => {
  pending = next;
};

/**
 * Читает и затирает pending-edit (одноразово).
 *
 * @returns {PendingReservationEdit | null} Текущие данные или null.
 */
export const consumePendingReservationEdit = (): PendingReservationEdit | null => {
  const value = pending;
  pending = null;
  return value;
};

export type { PendingReservationEdit };
