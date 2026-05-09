import parse from 'html-react-parser';
import type { IAttributeValues } from 'oneentry/dist/base/utils';

type AttributeValuesInput = IAttributeValues | undefined;

/**
 * Извлекает строковое значение атрибута типа String.
 *
 * @param   {string}                  name            - Имя атрибута.
 * @param   {AttributeValuesInput}    attributeValues - Значения атрибутов.
 * @returns {string}                                  Строковое значение или пустая строка.
 */
export const getString = (name: string, attributeValues: AttributeValuesInput): string => {
  const attr = attributeValues?.[name];
  if (attr && typeof attr === 'object' && 'value' in attr && typeof attr.value === 'string') {
    return attr.value;
  }
  return '';
};

/**
 * Извлекает HTML/plain значение атрибута типа Text.
 *
 * @param   {string}                          name            - Имя атрибута.
 * @param   {AttributeValuesInput}            attributeValues - Значения атрибутов.
 * @param   {'html' | 'plain'}                type            - Формат вывода.
 * @returns {string | ReturnType<typeof parse>}               HTML-узлы или строка.
 */
export const getText = (
  name: string,
  attributeValues: AttributeValuesInput,
  type: 'html' | 'plain' = 'plain'
): string | ReturnType<typeof parse> => {
  const data = attributeValues?.[name];
  if (
    data &&
    typeof data === 'object' &&
    'value' in data &&
    Array.isArray(data.value) &&
    data.value.length > 0
  ) {
    const text = data.value[0] as { htmlValue?: string; plainValue?: string };

    if (text && typeof text === 'object' && ('htmlValue' in text || 'plainValue' in text)) {
      if (type === 'html' && typeof text.htmlValue === 'string') {
        return parse(text.htmlValue);
      }
      return typeof text.plainValue === 'string' ? text.plainValue : '';
    }
  }
  return '';
};

/**
 * Извлекает URL изображения из значений атрибута типа Image.
 *
 * @param   {string}                  name            - Имя атрибута.
 * @param   {AttributeValuesInput}    attributeValues - Значения атрибутов.
 * @param   {'image' | 'preview'}     type            - Полное изображение или превью.
 * @returns {string}                                  URL или пустая строка.
 */
export const getImageUrl = (
  name: string,
  attributeValues: AttributeValuesInput,
  type: 'image' | 'preview' = 'image'
): string => {
  const data = attributeValues?.[name];
  if (data && typeof data === 'object' && 'value' in data) {
    const value = data.value as
      | { downloadLink?: string; previewLink?: string }
      | Array<{ downloadLink?: string; previewLink?: string }>;
    const firstImage = Array.isArray(value) ? value[0] : value;

    if (
      firstImage &&
      typeof firstImage === 'object' &&
      'downloadLink' in firstImage &&
      typeof firstImage.downloadLink === 'string'
    ) {
      if (type === 'preview') {
        return firstImage.previewLink ?? '';
      } else {
        return firstImage.downloadLink;
      }
    }
    return '';
  }
  return '';
};
