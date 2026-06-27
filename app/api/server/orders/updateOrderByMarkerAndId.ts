import type { IError } from 'oneentry/dist/base/utils';
import type { IBaseOrdersEntity, IOrderData } from 'oneentry/dist/orders/ordersInterfaces';

import { getApi, isError } from '@/app/api';

interface HandleProps {
  marker: string;
  id: number;
  data: IOrderData;
}

/**
 * updateOrderByMarkerAndId — updates an order in the user's order-storage.
 *
 * @param   {HandleProps} props        - Update arguments.
 * @param   {string}      props.marker - Order-storage marker (e.g. `cart`, `booking_order`).
 * @param   {number}      props.id     - Numeric order id inside that storage.
 * @param   {IOrderData}  props.data   - Partial order payload accepted by `Orders.updateOrderByMarkerAndId`.
 * @returns Promise resolving to `{ isError, error?, order? }` (graceful fallback on SDK error).
 */
export const updateOrderByMarkerAndId = async ({
  marker,
  id,
  data,
}: HandleProps): Promise<{
  isError: boolean;
  error?: IError;
  order?: IBaseOrdersEntity;
}> => {
  try {
    const orderData = await getApi().Orders.updateOrderByMarkerAndId(marker, id, data);

    if (isError(orderData)) {
      return { isError: true, error: orderData };
    } else {
      return { isError: false, order: orderData };
    }
  } catch (e: unknown) {
    return { isError: true, error: e as IError };
  }
};
