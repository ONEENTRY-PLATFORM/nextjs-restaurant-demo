/* eslint-disable @typescript-eslint/no-explicit-any */
import parse from 'html-react-parser';

/**
 * Использует тип String.
 * @param   {string}                  name            - Имя атрибута.
 * @param   {Record<string, unknown>} attributeValues - Значения атрибутов.
 * @returns {string}                                  Строковое значение или undefined.
 */
export const getString = (
  name: string,
  attributeValues: Record<string, any>,
): string => {
  if (
    attributeValues?.[name] &&
    typeof attributeValues[name] === 'object' &&
    'value' in attributeValues[name] &&
    typeof attributeValues[name].value === 'string'
  ) {
    return attributeValues[name].value;
  }
  return '';
};

/**
 * Использует тип Text.
 * @param   {string}                name            - Имя атрибута.
 * @param   {object}                attributeValues - Объект значений атрибутов.
 * @param   {string}                type            - Тип контента.
 * @returns {string | [] | unknown}                 HTML-контент.
 */
export const getText = (
  name: string,
  attributeValues: any,
  type: 'html' | 'plain' = 'plain',
): string | [] | any => {
  const data = attributeValues?.[name];
  if (
    data &&
    typeof data === 'object' &&
    'value' in data &&
    Array.isArray(data.value) &&
    data.value.length > 0
  ) {
    const text = data.value[0];

    if (
      text &&
      typeof text === 'object' &&
      ('htmlValue' in text || 'plainValue' in text)
    ) {
      if (type === 'html' && typeof text.htmlValue === 'string') {
        const val = parse(text.htmlValue);
        return val;
      }
      return typeof text.plainValue === 'string' ? text.plainValue : '';
    }
  }
  return '';
};

// /**
//  * getTextWithHeader
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const getTextWithHeader = (
//   name: string,
//   attributeValues: any,
//   type: 'html' | 'plain' = 'plain',
// ): string | [] | any => {};

// /**
//  * Integer
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useInteger = (
//   name: any,
//   attributeValues: any,
//   type: '' | '' = '',
// ): any => {};

// /**
//  * Real
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useReal = (
//   name: any,
//   attributeValues: any,
//   type: '' | '' = '',
// ): any => {};

// /**
//  * Float
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useFloat = (
//   name: any,
//   attributeValues: any,
//   type: '' | '' = '',
// ): any => {};

// /**
//  * Дата и время
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useDateTime = (
//   name: any,
//   attributeValues: any,
//   type: '' | '' = '',
// ): any => {};

// /**
//  * Дата
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useDate = (
//   name: any,
//   attributeValues: any,
//   type: '' | '' = '',
// ): any => {};

// /**
//  * Время
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useTime = (
//   name: any,
//   attributeValues: any,
//   type: '' | '' = '',
// ): any => {};

// /**
//  * Файл
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useFile = (
//   name: any,
//   attributeValues: any,
//   type: '' | '' = '',
// ): any => {};

/**
 * Использует тип image — извлекает URL изображения из значений атрибута.
 * @param   {string}  name            - Имя атрибута.
 * @param   {unknown} attributeValues - Значения атрибутов.
 * @param   {string}  type            - Тип изображения.
 * @returns {string}                  URL изображения или пустая строка.
 */
export const getImageUrl = (
  name: string,
  attributeValues: any,
  type: 'image' | 'preview' = 'image',
): string => {
  const data = attributeValues?.[name];
  if (data && typeof data === 'object' && 'value' in data) {
    const firstImage = data.value[0] || data.value;

    if (
      firstImage &&
      typeof firstImage === 'object' &&
      'downloadLink' in firstImage &&
      typeof firstImage.downloadLink === 'string'
    ) {
      if (type === 'preview') {
        return firstImage.previewLink;
      } else {
        return firstImage.downloadLink;
      }
    }
    return '';
  }
  return '';
};

// /**
//  * Группа изображений
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useImagesGroup = (
//   name: string,
//   attributeValues: any,
//   type: 'image' | 'preview' = 'image',
// ): string[] | [] | any => {};

// /**
//  * Radio Button
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useRadio = (
//   name: string,
//   attributeValues: any,
// ): string | [] | any => {};

// /**
//  * Entity
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useEntity = (
//   name: string,
//   attributeValues: any,
// ): string | [] | any => {};

// /**
//  * Integer
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useList = (
//   name: string,
//   attributeValues: any,
//   type: 'html' | 'plain' = 'plain',
// ): string | [] | any => {};

// /**
//  * Временной интервал
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useTimeInterval = (
//   name: string,
//   attributeValues: any,
// ): string | [] | any => {};

// /**
//  * JSON
//  *
//  * @param name
//  * @param attributeValues
//  * @param type
//  */
// export const useJson = (
//   name: string,
//   attributeValues: any,
// ): string | [] | any => {};
