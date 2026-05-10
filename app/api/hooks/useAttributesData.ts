import parse from 'html-react-parser';
import type { IAttributeValues } from 'oneentry/dist/base/utils';

type AttributeValuesInput = IAttributeValues | undefined;

/**
 * getString — extracts a string value from a String attribute.
 *
 * @param   {string}                name            - Attribute marker.
 * @param   {AttributeValuesInput}  attributeValues - OneEntry `attributeValues` map.
 * @returns {string}                                  String value, or an empty string when absent.
 */
export const getString = (name: string, attributeValues: AttributeValuesInput): string => {
  const attr = attributeValues?.[name];
  if (attr && typeof attr === 'object' && 'value' in attr && typeof attr.value === 'string') {
    return attr.value;
  }
  return '';
};

/**
 * getText — extracts an HTML or plain value from a Text attribute.
 *
 * @param   {string}                name            - Attribute marker.
 * @param   {AttributeValuesInput}  attributeValues - OneEntry `attributeValues` map.
 * @param   {'html' | 'plain'}      [type]          - Output format (`html` returns parsed nodes, `plain` returns a string).
 * @returns {string | ReturnType<typeof parse>}      Parsed HTML nodes or a plain string.
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
 * getImageUrl — extracts the image URL from an Image attribute's value.
 *
 * @param   {string}                name            - Attribute marker.
 * @param   {AttributeValuesInput}  attributeValues - OneEntry `attributeValues` map.
 * @param   {'image' | 'preview'}   [type]          - `image` for the full asset, `preview` for the previewLink.
 * @returns {string}                                  URL, or an empty string when no image is set.
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
