/* eslint-disable no-console */
import { getApi } from '@/app/api';

/** onSubscribeEvents — subscribes to events via the Events API. */
export const onSubscribeEvents = async (id: number) => {
  try {
    await getApi().Events.subscribeByMarker('catalog_event', id);
    await getApi().Events.subscribeByMarker('status_out_of_stock', id);
    await getApi().Events.subscribeByMarker('product_price', id);
  } catch (e) {
    console.log(e);
  }
};

/** onUnsubscribeEvents — unsubscribes from events via the Events API. */
export const onUnsubscribeEvents = async (id: number) => {
  try {
    await getApi().Events.unsubscribeByMarker('catalog_event', id);
    await getApi().Events.unsubscribeByMarker('status_out_of_stock', id);
    await getApi().Events.unsubscribeByMarker('product_price', id);
  } catch (e) {
    console.log(e);
  }
};
