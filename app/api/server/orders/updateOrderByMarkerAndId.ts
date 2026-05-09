import type { IError } from 'oneentry/dist/base/utils';
import type { IBaseOrdersEntity, IOrderData } from 'oneentry/dist/orders/ordersInterfaces';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  marker: string;
  id: number;
  data: IOrderData;
}

/** updateOrderByMarkerAndId — обновляет заказ в order-storage пользователя. */
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

    if (typeError(orderData)) {
      return { isError: true, error: orderData };
    } else {
      return { isError: false, order: orderData };
    }
  } catch (e: unknown) {
    return { isError: true, error: e as IError };
  }
};
