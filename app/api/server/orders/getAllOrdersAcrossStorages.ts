import type { IError } from 'oneentry/dist/base/utils';
import type { IOrderByMarkerEntity, IOrdersEntity } from 'oneentry/dist/orders/ordersInterfaces';
import { cache } from 'react';

import { getApi, getLang, isError } from '@/app/api';

// Re-exported from the pure constants module so unit tests can import it without the SDK/api chain.
export { isBookingStorageMarker } from '@/app/utils/constants';

/** An order tagged with the storage it came from, so cancel/edit target the right storage marker. */
export type OrderWithStorage = IOrderByMarkerEntity & {
  storageMarker: string;
  storageFormIdentifier: string;
};

interface HandleProps {
  offset?: number;
  limit?: number;
  langCode?: string;
}

/**
 * getAllOrdersAcrossStorages — every order from every order-storage the user has, tagged with its storage.
 *
 * @param   {HandleProps} [props]          - Fetch arguments.
 * @param   {number}      [props.offset]   - Page offset per storage (default 0).
 * @param   {number}      [props.limit]    - Page size per storage (default 50).
 * @param   {string}      [props.langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns Promise resolving to `{ isError, error?, orders }` (orders empty on storage-list error).
 */
export const getAllOrdersAcrossStorages = cache(
  async ({ offset = 0, limit = 50, langCode }: HandleProps = {}): Promise<{
    isError: boolean;
    error?: IError;
    orders: OrderWithStorage[];
  }> => {
    try {
      const lang = langCode || getLang();
      const storages = await getApi().Orders.getAllOrdersStorage(lang);
      if (isError(storages)) {
        return { isError: true, error: storages, orders: [] };
      }

      const perStorage = await Promise.all(
        (storages as IOrdersEntity[]).map(async storage => {
          const marker = storage.identifier;
          if (!marker) return [] as OrderWithStorage[];
          const data = await getApi().Orders.getAllOrdersByMarker(marker, lang, offset, limit);
          if (isError(data)) return [] as OrderWithStorage[];
          const storageFormIdentifier = storage.formIdentifier ?? marker;
          return (data.items ?? []).map(
            (o: IOrderByMarkerEntity): OrderWithStorage => ({
              ...o,
              storageMarker: marker,
              storageFormIdentifier,
            })
          );
        })
      );

      return { isError: false, orders: perStorage.flat() };
    } catch (e: unknown) {
      return { isError: true, error: e as IError, orders: [] };
    }
  }
);
