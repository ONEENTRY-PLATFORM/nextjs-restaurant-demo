import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';

/**
 * Markers rendered by bespoke UI (or sourced from the profile) — excluded from the generic pass so
 * the designed checkout layout is preserved: `delivery_address`/`delivery_time`/`comment`/`alt_phone`
 * have dedicated rows, `contact_phone` is auto-filled from the profile, `addresses` is an internal
 * json bag.
 */
export const HANDLED_MARKERS = new Set([
  'delivery_address',
  'delivery_time',
  'comment',
  'alt_phone',
  'contact_phone',
  'addresses',
]);

/**
 * inputTypeForAttribute — maps a OneEntry attribute type to an HTML input type for generic fields.
 *
 * @param   {string} [type] - OneEntry attribute `type`.
 * @returns HTML input `type` value.
 */
export const inputTypeForAttribute = (type?: string): string => {
  switch (type) {
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'number':
    case 'integer':
    case 'float':
      return 'number';
    default:
      return 'text';
  }
};

/**
 * selectGenericFields — visible form attributes not covered by a bespoke row, sorted by position.
 *
 * These are rendered as generic inputs so a newly-added admin field surfaces automatically.
 *
 * @param   {IFormAttribute[]} [attributes] - Form attributes from `getFormByMarker`.
 * @returns Generic attributes to render, ordered by `position`.
 */
export const selectGenericFields = (attributes?: IFormAttribute[]): IFormAttribute[] =>
  (attributes ?? [])
    .filter(a => a.isVisible !== false && !HANDLED_MARKERS.has(a.marker))
    .slice()
    .sort((a, b) => a.position - b.position);
