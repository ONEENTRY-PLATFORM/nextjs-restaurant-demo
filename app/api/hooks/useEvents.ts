/* eslint-disable no-console */
import { getApi } from '@/app/api';

/**
 * onSubscribeEvents — subscribes to product-related events via the Events API (catalog, stock, price).
 *
 * @param   {number}        id - Product id to subscribe to.
 * @returns Promise that resolves once all subscription requests have settled.
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
 * @returns Promise that resolves once all unsubscription requests have settled.
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

/**
 * onSubscribeToForm — subscribe to status changes of a FormData record.
 *
 * For form-driven flows that want push updates when the admin changes a record's
 * status (e.g. review moderation: notify the author when a review is approved).
 *
 * @param   {string} formMarker - Form/event marker.
 * @param   {number} formDataId - FormData record id to watch.
 * @param   {string} [status]   - Optional status to subscribe for.
 * @returns Promise resolving to `true` on success, `false` on error.
 */
export const onSubscribeToForm = async (
  formMarker: string,
  formDataId: number,
  status?: string
): Promise<boolean> => {
  try {
    const res = await getApi().Events.subscribeToForm(formMarker, {
      formDataId,
      ...(status ? { status } : {}),
    });
    return res === true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

/**
 * onUnsubscribeFromForm — removes a FormData status subscription.
 *
 * @param   {string} formMarker - Form/event marker.
 * @param   {number} formDataId - FormData record id.
 * @returns Promise resolving to `true` on success, `false` on error.
 */
export const onUnsubscribeFromForm = async (
  formMarker: string,
  formDataId: number
): Promise<boolean> => {
  try {
    const res = await getApi().Events.unsubscribeFromForm(formMarker, { formDataId });
    return res === true;
  } catch (e) {
    console.log(e);
    return false;
  }
};
