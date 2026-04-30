import type { IError } from 'oneentry/dist/base/utils';
import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';

import { api, getLang } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  marker: string;
  offset: number;
  limit: number;
  langCode?: string;
}
/**
 * Получает все заказы из объекта хранилища заказов, созданного пользователем.
 */
export const getAllOrdersByMarker = async ({
  marker,
  offset,
  limit,
  langCode,
}: HandleProps): Promise<{
  isError: boolean;
  error?: IError;
  orders?: IOrderByMarkerEntity[];
  total: number;
}> => {
  try {
    const data = await api.Orders.getAllOrdersByMarker(
      marker,
      langCode || getLang(),
      offset,
      limit,
    );

    if (typeError(data)) {
      return { isError: true, error: data, total: 0 };
    } else {
      return { isError: false, orders: data.items, total: data.total };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e, total: 0 };
  }
};
