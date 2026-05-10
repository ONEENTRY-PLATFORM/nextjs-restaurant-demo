import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

export type SavedAddress = {
  id: string;
  street: string;
  house: string;
  floor: string;
  selected?: boolean;
};

/**
 * parseSavedAddresses — reads saved addresses from `user_address`.
 *
 * OneEntry stores the value as an array or a JSON string — both are supported.
 *
 * @param   {ReadonlyArray<FormDataType> | undefined} formData - User formData array.
 * @returns {SavedAddress[]}                                     Parsed list of `SavedAddress` items (empty on parse failure or unexpected shape).
 */
export const parseSavedAddresses = (
  formData: ReadonlyArray<FormDataType> | undefined
): SavedAddress[] => {
  if (!formData) return [];
  const entry = formData.find(el => (el as { marker?: string }).marker === 'user_address') as
    | { value?: unknown }
    | undefined;
  let raw: unknown = entry?.value;
  if (typeof raw === 'string') {
    if (!raw) return [];
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is SavedAddress => typeof a === 'object' && a !== null && typeof a.id === 'string'
  );
};

/**
 * pickSelectedAddress — picks the address marked `selected`, falling back to the first item.
 *
 * @param   {ReadonlyArray<SavedAddress>} list - Saved address list.
 * @returns {SavedAddress | null}                Selected `SavedAddress`, or `null` when the list is empty.
 */
export const pickSelectedAddress = (list: ReadonlyArray<SavedAddress>): SavedAddress | null => {
  if (list.length === 0) return null;
  return list.find(a => a.selected) ?? list[0] ?? null;
};

/**
 * formatAddressLine — formats a `SavedAddress` as "Main str., 12, fl. 3" (empty fields are skipped).
 *
 * @param   {SavedAddress | null} a - Saved address (or `null`).
 * @returns {string}                  One-line display string (empty when `a` is `null`).
 */
export const formatAddressLine = (a: SavedAddress | null): string => {
  if (!a) return '';
  const parts = [a.street && `${a.street} str.`, a.house, a.floor && `fl. ${a.floor}`].filter(
    Boolean
  );
  return parts.join(', ');
};
