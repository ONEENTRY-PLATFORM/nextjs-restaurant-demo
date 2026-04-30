import type { IError } from 'oneentry/dist/base/utils';
import type {
  IBaseOrdersEntity,
  IOrderData,
} from 'oneentry/dist/orders/ordersInterfaces';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  marker: string;
  id: number;
  data: IOrderData;
}

/**
 * Обновляет заказ в объекте хранилища заказов, созданном пользователем.
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
    const orderData = await api.Orders.updateOrderByMarkerAndId(
      marker,
      id,
      data,
    );

    if (typeError(orderData)) {
      return { isError: true, error: orderData };
    } else {
      return { isError: false, order: orderData };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
