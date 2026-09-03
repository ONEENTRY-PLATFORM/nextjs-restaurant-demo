import type { IError, IOrderByMarkerEntity, IOrdersEntity } from 'oneentry/types';
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
 * Safety stop for the per-storage walk.
 *
 * `total` comes from the API, so a runaway value would otherwise turn one
 * profile render into an unbounded request loop.
 */
const MAX_ORDERS_PER_STORAGE = 1000;

/**
 * collectStorageOrders — every order in one storage, following `total` across pages.
 *
 * Requests one page, then keeps going while the collected count is behind
 * `total`, stopping early on an SDK error or an empty page.
 *
 * @param   {string} marker      - Order-storage marker.
 * @param   {string} lang        - Locale code.
 * @param   {number} startOffset - Offset of the first page.
 * @param   {number} pageSize    - Page size per request.
 * @returns Promise resolving to the orders collected (empty when the first read fails).
 */
const collectStorageOrders = async (
  marker: string,
  lang: string,
  startOffset: number,
  pageSize: number
): Promise<IOrderByMarkerEntity[]> => {
  const collected: IOrderByMarkerEntity[] = [];
  let offset = startOffset;

  while (collected.length < MAX_ORDERS_PER_STORAGE) {
    const data = await getApi().Orders.getAllOrdersByMarker(marker, lang, offset, pageSize);
    if (isError(data)) break;

    const items = data.items ?? [];
    collected.push(...items);
    if (items.length === 0) break;

    offset += pageSize;
    if (offset >= (data.total ?? 0)) break;
  }

  return collected;
};

/**
 * getAllOrdersAcrossStorages — every order from every order-storage the user has, tagged with its storage.
 *
 * @param   {HandleProps} [props]          - Fetch arguments.
 * Each storage is read to the end rather than one page deep: `limit` is the
 * page size, and the walk follows `total`. A single 50-item request used to drop
 * every order past the 50th with no sign of it in the UI or the logs.
 *
 * @param   {number}      [props.offset]   - Offset of the first page per storage (default 0).
 * @param   {number}      [props.limit]    - Page size per request (default 50).
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
      // `{}` instead of a list — the SDK's empty/unparsable-body fallback; treat it as "no storages".
      if (!Array.isArray(storages)) {
        return { isError: false, orders: [] };
      }

      const perStorage = await Promise.all(
        (storages as IOrdersEntity[]).map(async storage => {
          const marker = storage.identifier;
          if (!marker) return [] as OrderWithStorage[];
          const orders = await collectStorageOrders(marker, lang, offset, limit);
          const storageFormIdentifier = storage.formIdentifier ?? marker;
          return orders.map((o: IOrderByMarkerEntity): OrderWithStorage => ({
            ...o,
            storageMarker: marker,
            storageFormIdentifier,
          }));
        })
      );

      return { isError: false, orders: perStorage.flat() };
    } catch (e: unknown) {
      return { isError: true, error: e as IError, orders: [] };
    }
  }
);
