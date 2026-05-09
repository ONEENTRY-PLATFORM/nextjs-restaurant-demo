import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

export type SavedAddress = {
  id: string;
  street: string;
  house: string;
  floor: string;
  selected?: boolean;
};

/**
 * Достаёт сохранённые адреса из `user_address`. OneEntry хранит value как массив или JSON-строку — поддерживаем оба.
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

export const pickSelectedAddress = (list: ReadonlyArray<SavedAddress>): SavedAddress | null => {
  if (list.length === 0) return null;
  return list.find(a => a.selected) ?? list[0] ?? null;
};

/** "Main str., 12, fl. 3" — пропускает пустые поля. */
export const formatAddressLine = (a: SavedAddress | null): string => {
  if (!a) return '';
  const parts = [a.street && `${a.street} str.`, a.house, a.floor && `fl. ${a.floor}`].filter(
    Boolean
  );
  return parts.join(', ');
};
