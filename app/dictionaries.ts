import 'server-only';

import type { IAttributeValue, IAttributeValues } from 'oneentry/dist/base/utils';

import { dictText } from '@/components/utils';

import { getAttributesByMarker } from './api/server/attributes/getAttributesByMarker';
import getCachedData from './api/utils/getCachedData';

/**
 * Загружает атрибут-сет `static_content` и нормализует его в
 * `Record<marker, IAttributeValue>`, чтобы шаблонное обращение
 * `dict?.MARKER?.value` отдавало строку (а не undefined по индексу массива).
 *
 * Поле `value` атрибут-сета — это локализационная мапа, в этом проекте
 * пока пустая `{}`, поэтому в нормализованной записи `value`
 * проставляется из `initialValue` (английский дефолт из админки).
 * @returns {Promise<IAttributeValues>} Map маркеров → атрибут с строковым `value`.
 */
const fetchDictionary = async (): Promise<IAttributeValues> => {
  try {
    const { isError, attributes } = await getAttributesByMarker({
      attributeMarker: 'static_content',
    });

    if (isError || !Array.isArray(attributes)) {
      return {} as IAttributeValues;
    }

    const dict = {} as IAttributeValues;
    for (const raw of attributes as unknown as Array<{
      marker: string;
      value?: unknown;
      initialValue?: string;
    }>) {
      const isEmpty =
        raw.value == null ||
        (typeof raw.value === 'object' && Object.keys(raw.value as object).length === 0);
      dict[raw.marker] = {
        ...raw,
        value: isEmpty ? (raw.initialValue ?? '') : raw.value,
      } as unknown as IAttributeValue;
    }
    return dict;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return {} as IAttributeValues;
  }
};

/**
 * Кешированный словарь `static_content` для использования в server-компонентах.
 * @returns {Promise<IAttributeValues>} Кешированный нормализованный словарь.
 */
export const getDictionary = async (): Promise<IAttributeValues> =>
  getCachedData('dictionary', fetchDictionary);

/**
 * Server-side аналог `useT()` — берёт строку из словаря `static_content` по
 * маркеру с fallback'ом, без пробрасывания `dict` через пропсы. Внутри
 * вызывает кешированный `getDictionary`, поэтому повторные вызовы
 * дешёвые. Использовать в server-компонентах вместо
 * `dictText(dict, marker, fallback)` с предварительным `await getDictionary()`.
 *
 * @example
 *   const title = await t('featured_objects', 'Featured objects');
 */
export const t = async (marker: string, fallback: string): Promise<string> => {
  const dict = await getDictionary();
  return dictText(dict, marker, fallback);
};
