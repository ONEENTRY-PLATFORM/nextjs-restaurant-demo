import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';

export type SavedAddress = {
  id: string;
  street: string;
  house: string;
  floor: string;
  selected?: boolean;
};

/** Minimal shape of the `user` form (`getFormByMarker`) consumed by the profile sections. */
export type UserFormData = { attributes?: IFormAttribute[] } | undefined;

/** Attributes of the `user` form that are not rendered in the "My Profile" section. */
export const HIDDEN_PROFILE_MARKERS = new Set([
  'repeat_password',
  'email_notifications',
  'email_notification_reg',
  'user_address',
  'user_flat',
  'user_floor',
]);

/**
 * parseAddresses — parses `user_address` JSON (array or legacy JSON string) into a typed list.
 *
 * @param   {unknown}        raw - Raw OneEntry attribute value.
 * @returns Array of `SavedAddress` items (empty on parse failure or unexpected shape).
 */
export const parseAddresses = (raw: unknown): SavedAddress[] => {
  if (!raw) return [];
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (a): a is SavedAddress => typeof a === 'object' && a !== null && typeof a.id === 'string'
  );
};

/**
 * resolveInputType — picks the HTML input type for a OneEntry user-form attribute.
 *
 * @param   {IFormAttribute} attr - OneEntry form attribute.
 * @returns `'password'`, `'email'`, or `'text'` depending on the marker.
 */
export const resolveInputType = (attr: IFormAttribute): string => {
  if (attr.marker.includes('password')) return 'password';
  if (attr.marker.includes('email')) return 'email';
  return 'text';
};

/**
 * getUserField — reads a OneEntry user `formData` value as a string.
 *
 * @param   {IUserEntity | undefined} user   - Current authenticated user.
 * @param   {string}                  marker - Attribute marker to read.
 * @returns String value, or empty string when missing / non-string.
 */
export const getUserField = (user: IUserEntity | undefined, marker: string): string => {
  if (!user?.formData || !Array.isArray(user.formData)) return '';
  const row = (user.formData as Array<{ marker: string; value: unknown }>).find(
    f => f.marker === marker
  );
  return typeof row?.value === 'string' ? row.value : '';
};

/**
 * getUserRawField — reads a OneEntry user `formData` value without casting.
 *
 * For `json` fields (`user_address`) where the SDK returns an array/object.
 *
 * @param   {IUserEntity | undefined} user   - Current authenticated user.
 * @param   {string}                  marker - Attribute marker to read.
 * @returns Raw value, or `undefined` when missing.
 */
export const getUserRawField = (user: IUserEntity | undefined, marker: string): unknown => {
  if (!user?.formData || !Array.isArray(user.formData)) return undefined;
  const row = (user.formData as Array<{ marker: string; value: unknown }>).find(
    f => f.marker === marker
  );
  return row?.value;
};
