import type { IFormAttribute } from 'oneentry/types';

/** Login / password field markers resolved from a form's `isLogin` / `isPassword` flags. */
export type AuthFieldMarkers = {
  loginMarker: string;
  passwordMarker: string;
};

/**
 * pickAuthMarkers — derives the login / password field markers from the `user` form attributes.
 *
 * Reads the `isLogin` / `isPassword` flags instead of hard-coding `email` / `password`, so a renamed
 * field or a non-email provider keeps working. Defaults stay `email` / `password` when no flagged
 * field is found.
 *
 * @param   {IFormAttribute[]} [attributes] - Form attributes from `getFormByMarker('user')`.
 * @returns `{ loginMarker, passwordMarker }`.
 */
export const pickAuthMarkers = (attributes?: IFormAttribute[]): AuthFieldMarkers => ({
  loginMarker: attributes?.find(a => a.isLogin)?.marker ?? 'email',
  passwordMarker: attributes?.find(a => a.isPassword)?.marker ?? 'password',
});
