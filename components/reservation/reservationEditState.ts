import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

/**
 * Сторонний канал для передачи pending-edit между {@link BookingsPopup}
 * и {@link ReservationPopup}. Использовать через
 * {@link setPendingReservationEdit} / {@link consumePendingReservationEdit}.
 *
 * Канал — module-level переменная, не Redux. Это сознательно: данные
 * нужны только на время одного перехода между двумя попапами,
 * глобальный store раздувать ради этого не имеет смысла. Также не
 * подходит `OpenDrawerContext.action` — он строковый и используется
 * для маркера ресторана при обычном open-from-restaurant-page потоке.
 */
type PendingReservationEdit = {
  orderId: number;
  formData: IOrdersFormData[];
  paymentAccountIdentifier: string;
  formIdentifier: string;
};

let pending: PendingReservationEdit | null = null;

/**
 * Сохраняет pending-edit (вызывает {@link BookingsPopup} перед открытием
 * ReservationPopup в режиме редактирования).
 * @param   {PendingReservationEdit | null} next - Данные для редактирования или null.
 * @returns {void}
 */
export const setPendingReservationEdit = (next: PendingReservationEdit | null): void => {
  pending = next;
};

/**
 * Читает и затирает pending-edit (одноразово). Вызывает
 * {@link ReservationPopup} при открытии — если есть данные, попап
 * рендерится в режиме «Edit», иначе — обычное создание новой брони.
 * @returns {PendingReservationEdit | null} Текущие данные или null.
 */
export const consumePendingReservationEdit = (): PendingReservationEdit | null => {
  const value = pending;
  pending = null;
  return value;
};

export type { PendingReservationEdit };
