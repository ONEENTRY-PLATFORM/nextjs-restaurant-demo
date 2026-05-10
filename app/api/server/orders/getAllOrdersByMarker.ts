import type { IError } from 'oneentry/dist/base/utils';
import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import { cache } from 'react';

import { getApi, getLang } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  marker: string;
  offset: number;
  limit: number;
  langCode?: string;
}
/**
 * getAllOrdersByMarker — all orders from the user's order-storage.
 *
 * @param   {HandleProps} props          - Fetch arguments.
 * @param   {string}      props.marker   - Order-storage marker (e.g. `cart`, `booking_order`).
 * @param   {number}      props.offset   - Page offset.
 * @param   {number}      props.limit    - Page size.
 * @param   {string}      [props.langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns {Promise<{ isError: boolean; error?: IError; orders?: IOrderByMarkerEntity[]; total: number }>}              Promise resolving to `{ isError, error?, orders?, total }` (graceful fallback on SDK error).
 */
export const getAllOrdersByMarker = cache(
  async ({
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
      const data = await getApi().Orders.getAllOrdersByMarker(
        marker,
        langCode || getLang(),
        offset,
        limit
      );

      if (typeError(data)) {
        return { isError: true, error: data, total: 0 };
      } else {
        return { isError: false, orders: data.items, total: data.total };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError, total: 0 };
    }
  }
);
