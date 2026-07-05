import { defineOneEntry } from 'oneentry';
import type { IError } from 'oneentry/dist/base/utils';

const PROJECT_URL = (process.env.NEXT_PUBLIC_ONEENTRY_URL ||
  process.env.NEXT_PUBLIC_PROJECT_URL) as string;
const APP_TOKEN = (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN ||
  process.env.NEXT_PUBLIC_APP_TOKEN) as string;

const DEFAULT_LANG = 'en_US';
const AUTH_PROVIDER_MARKER_KEY = 'auth-provider-marker';

/**
 * getStoredAuthProviderMarker — auth-provider marker the current session was created with.
 *
 * The OneEntry refresh endpoint is provider-scoped (`/marker/<provider>/users/refresh`):
 * refreshing a `google`-issued token via the default `email` marker returns
 * `400 "Provided token is incorrect"`, so the marker must survive reloads
 * alongside the refresh token.
 *
 * @returns Stored provider marker, or `'email'` when nothing is stored (incl. on the server).
 */
export const getStoredAuthProviderMarker = (): string => {
  if (typeof window === 'undefined') {
    return 'email';
  }
  return localStorage.getItem(AUTH_PROVIDER_MARKER_KEY) || 'email';
};

/**
 * saveAuthProviderMarker — persists the auth-provider marker of the active session.
 *
 * @param   {string} marker - Provider marker (`email`, `google`, …), or `''` to clear it.
 * @returns Nothing.
 */
export const saveAuthProviderMarker = (marker: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!marker) {
    localStorage.removeItem(AUTH_PROVIDER_MARKER_KEY);
    return;
  }
  localStorage.setItem(AUTH_PROVIDER_MARKER_KEY, marker);
};

/**
 * saveFunction — persists the refreshToken to localStorage on every SDK rotation.
 *
 * On rotation stores the fresh token; an empty string (the SDK sends it from
 * `logout`/`logoutAll`) removes the stored token and provider marker instead —
 * keeping the revoked token would feed refresh(400)/me(401) retry loops after sign-out.
 *
 * @param   {string}        refreshToken - Fresh refreshToken issued by the SDK, or `''` to clear it.
 * @returns Promise that resolves once the token has been written (no-op on the server).
 */
const saveFunction = async (refreshToken: string): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!refreshToken) {
    localStorage.removeItem('refresh-token');
    localStorage.removeItem(AUTH_PROVIDER_MARKER_KEY);
    return;
  }
  localStorage.setItem('refresh-token', refreshToken);
};

/** Mutable SDK instance. Recreated via {@link reDefine} on login / langCode change. */
export let api = defineOneEntry(PROJECT_URL, {
  langCode: DEFAULT_LANG,
  token: APP_TOKEN,
  auth: {
    saveFunction,
  },
});

/**
 * getApi — getter for the current SDK instance. Preferred over `api`: always
 * returns the fresh instance after {@link reDefine}.
 *
 * @returns Current OneEntry SDK instance.
 */
export const getApi = (): ReturnType<typeof defineOneEntry> => api;

/**
 * reDefine — recreates the SDK instance with a (possibly) new refreshToken and langCode.
 *
 * The stored auth-provider marker is passed along so token refresh hits the
 * provider the session was created with (a `google` token dies on the default
 * `email` refresh endpoint with `400 "Provided token is incorrect"`).
 *
 * @param   {string}        refreshToken - Refresh token from localStorage.
 * @param   {string}        [langCode]   - Current language (defaults to `en_US`).
 * @returns Promise that resolves after the SDK instance has been recreated.
 */
export async function reDefine(refreshToken: string, langCode?: string): Promise<void> {
  if (!refreshToken) {
    return;
  }
  api = defineOneEntry(PROJECT_URL, {
    langCode: langCode || DEFAULT_LANG,
    token: APP_TOKEN,
    auth: {
      refreshToken,
      providerMarker: getStoredAuthProviderMarker(),
      saveFunction,
    },
  });
}

/**
 * hasActiveSession — whether the current SDK instance carries a valid accessToken.
 *
 * @returns `true` when an accessToken is currently held by the SDK auth provider.
 */
export const hasActiveSession = (): boolean => {
  const provider = api.AuthProvider as unknown as {
    state?: { accessToken?: string };
  };
  return Boolean(provider?.state?.accessToken);
};

/**
 * syncTokens — writes both tokens directly into the current SDK instance's state.
 *
 * @param   {string} accessToken  - Access JWT from `auth()`.
 * @param   {string} refreshToken - Refresh token from `auth()`.
 * @returns
 */
export const syncTokens = (accessToken: string, refreshToken: string): void => {
  const provider = api.AuthProvider as unknown as {
    setAccessToken: (t: string) => void;
    setRefreshToken: (t: string) => void;
  };
  provider.setAccessToken(accessToken);
  provider.setRefreshToken(refreshToken);
};

/**
 * setGuestId — sets the guest identifier sent as the `x-guest-id` header on
 * unauthenticated cart / wishlist / activity requests.
 *
 * @param   {string} guestId - Guest id to set, or `''` to clear it.
 * @returns Nothing.
 */
export const setGuestId = (guestId: string): void => {
  (api as unknown as { setGuestId?: (id: string) => unknown }).setGuestId?.(guestId);
};

/**
 * getDeviceMetadata — device-fingerprint string the SDK sends as `x-device-metadata`.
 *
 * OneEntry binds refresh tokens to this fingerprint: a token issued under one
 * metadata string cannot be refreshed with another (400 "Provided token is
 * incorrect"). Server-side flows that issue tokens for the browser (OAuth code
 * exchange) must therefore forward the browser's string, not their own.
 *
 * @returns Metadata string of the current SDK instance (stable per browser via
 *          the persistent `oneentry_device_id` in localStorage).
 */
export const getDeviceMetadata = (): string => {
  const provider = api.AuthProvider as unknown as {
    _getDeviceMetadata?: () => string;
  };
  return provider._getDeviceMetadata?.() ?? '';
};

/**
 * getLang — current langCode of the SDK instance.
 *
 * @returns Language code currently configured on the SDK (e.g. `en_US`).
 */
export const getLang = (): string => {
  const cfg = (api as unknown as { config?: { langCode?: string } }).config;
  return cfg?.langCode || DEFAULT_LANG;
};

/**
 * isError — type guard for SDK responses: `true` when the value is an `IError`.
 *
 * @param   {unknown}            result - SDK response to check.
 * @returns `true` when `result` is an SDK error envelope (`{ statusCode, message }`).
 */
export const isError = (result: unknown): result is IError => {
  if (!result || typeof result !== 'object') {
    return false;
  }
  return typeof (result as Record<string, unknown>).statusCode === 'number';
};

type ImageField = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

/**
 * getImageUrl — normalises a OneEntry `image` attribute value into a URL string.
 *
 * @param   {ImageField} value - `attributeValues.<marker>.value` from the SDK.
 * @returns Download URL, or an empty string when no image is present.
 */
export const getImageUrl = (value: ImageField): string => {
  if (!value) {
    return '';
  }
  if (Array.isArray(value)) {
    return value[0]?.downloadLink ?? '';
  }
  return value.downloadLink ?? '';
};
