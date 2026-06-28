import parse from 'html-react-parser';
import type { IAttributeValues } from 'oneentry/dist/base/utils';

type AttributeValuesInput = IAttributeValues | undefined;

/**
 * Single image entry inside a OneEntry `image` / `groupOfImages` attribute value.
 */
type OneEntryImageValue = {
  downloadLink?: string;
  defaultPreview?: string;
  previewLink?: string | Record<string, [string?, string?] | undefined>;
};

/**
 * getString — extracts a string value from a String attribute.
 *
 * @param   {string}                name            - Attribute marker.
 * @param   {AttributeValuesInput}  attributeValues - OneEntry `attributeValues` map.
 * @returns String value, or an empty string when absent.
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
 * @returns Parsed HTML nodes or a plain string.
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
 * getProductImageUrl — first image URL from a product `images` (groupOfImages) attribute.
 *
 * @param   {AttributeValuesInput} attributeValues - OneEntry product `attributeValues` map.
 * @returns First image download URL, or an empty string when no image is configured.
 */
export const getProductImageUrl = (attributeValues: AttributeValuesInput): string => {
  const value = attributeValues?.images?.value;
  if (Array.isArray(value)) {
    const first = value[0] as { downloadLink?: string } | undefined;
    return first?.downloadLink ?? '';
  }
  return '';
};

/**
 * getProductCurrency — ISO-4217 currency code from a product `currency` (string) attribute.
 *
 * @param   {AttributeValuesInput} attributeValues - OneEntry product `attributeValues` map.
 * @returns Currency code (e.g. `USD`), or an empty string when not set (callers fall back to the project default).
 */
export const getProductCurrency = (attributeValues: AttributeValuesInput): string => {
  const value = attributeValues?.currency?.value;
  return typeof value === 'string' ? value.trim() : '';
};

/**
 * getProductBlurDataURL — inline base64 LQIP placeholder for a product's first image.
 *
 * @param   {AttributeValuesInput} attributeValues - OneEntry product `attributeValues` map.
 * @returns Base64 `data:` URI for the LQIP, or an empty string when OneEntry has no inline preview.
 */
export const getProductBlurDataURL = (attributeValues: AttributeValuesInput): string => {
  const value = attributeValues?.images?.value;
  const first = Array.isArray(value) ? (value[0] as OneEntryImageValue | undefined) : undefined;
  const variant =
    first?.defaultPreview && typeof first.previewLink === 'object'
      ? first.previewLink[first.defaultPreview]
      : undefined;
  const blur = Array.isArray(variant) ? variant[0] : undefined;
  return typeof blur === 'string' && blur.startsWith('data:') ? blur : '';
};

/**
 * getImageUrl — extracts the image URL from an Image attribute's value.
 *
 * @param   {string}                name            - Attribute marker.
 * @param   {AttributeValuesInput}  attributeValues - OneEntry `attributeValues` map.
 * @param   {'image' | 'preview'}   [type]          - `image` for the full asset, `preview` for the preview-sized URL (falls back to the full asset).
 * @returns URL, or an empty string when no image is set.
 */
export const getImageUrl = (
  name: string,
  attributeValues: AttributeValuesInput,
  type: 'image' | 'preview' = 'image'
): string => {
  const data = attributeValues?.[name];
  if (data && typeof data === 'object' && 'value' in data) {
    const value = data.value as OneEntryImageValue | OneEntryImageValue[];
    const firstImage = Array.isArray(value) ? value[0] : value;

    if (
      firstImage &&
      typeof firstImage === 'object' &&
      typeof firstImage.downloadLink === 'string'
    ) {
      if (type === 'preview') {
        const variant =
          firstImage.defaultPreview && typeof firstImage.previewLink === 'object'
            ? firstImage.previewLink[firstImage.defaultPreview]
            : undefined;
        return (Array.isArray(variant) ? variant[1] : undefined) ?? firstImage.downloadLink;
      }
      return firstImage.downloadLink;
    }
    return '';
  }
  return '';
};
