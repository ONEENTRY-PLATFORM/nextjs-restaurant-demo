import type { IOrdersFormData } from 'oneentry/types';

/**
 * Side channel for passing the pending-edit payload between BookingsPopup and ReservationPopup.
 * Module-level variable: the data only needs to live across a single popup-to-popup transition.
 */
type PendingReservationEdit = {
  orderId: number;
  formData: IOrdersFormData[];
  paymentAccountIdentifier: string;
  formIdentifier: string;
};

let pending: PendingReservationEdit | null = null;

/**
 * setPendingReservationEdit — persists the pending edit before opening ReservationPopup in edit mode.
 *
 * @param   {PendingReservationEdit | null} next - Edit payload, or `null` to clear.
 * @returns
 */
export const setPendingReservationEdit = (next: PendingReservationEdit | null): void => {
  pending = next;
};

/**
 * consumePendingReservationEdit — reads and clears the pending edit (one-shot).
 *
 * @returns Current payload or `null` when nothing is pending.
 */
export const consumePendingReservationEdit = (): PendingReservationEdit | null => {
  const value = pending;
  pending = null;
  return value;
};

export type { PendingReservationEdit };
