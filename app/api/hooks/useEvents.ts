/* eslint-disable no-console */
import { getApi } from '@/app/api';

/**
 * onSubscribeEvents — subscribes to product-related events via the Events API (catalog, stock, price).
 *
 * @param   {number}        id - Product id to subscribe to.
 * @returns {Promise<void>}      Promise that resolves once all subscription requests have settled.
 */
export const onSubscribeEvents = async (id: number) => {
  try {
    await getApi().Events.subscribeByMarker('catalog_event', id);
    await getApi().Events.subscribeByMarker('status_out_of_stock', id);
    await getApi().Events.subscribeByMarker('product_price', id);
  } catch (e) {
    console.log(e);
  }
};

/**
 * onUnsubscribeEvents — unsubscribes from product-related events via the Events API.
 *
 * @param   {number}        id - Product id to unsubscribe from.
 * @returns {Promise<void>}      Promise that resolves once all unsubscription requests have settled.
 */
export const onUnsubscribeEvents = async (id: number) => {
  try {
    await getApi().Events.unsubscribeByMarker('catalog_event', id);
    await getApi().Events.unsubscribeByMarker('status_out_of_stock', id);
    await getApi().Events.unsubscribeByMarker('product_price', id);
  } catch (e) {
    console.log(e);
  }
};
