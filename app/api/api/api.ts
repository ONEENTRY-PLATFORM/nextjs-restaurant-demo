import { defineOneEntry } from 'oneentry';
import type { IError } from 'oneentry/dist/base/utils';

const PROJECT_URL = (process.env.NEXT_PUBLIC_ONEENTRY_URL ||
  process.env.NEXT_PUBLIC_PROJECT_URL) as string;
const APP_TOKEN = (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN ||
  process.env.NEXT_PUBLIC_APP_TOKEN) as string;

const DEFAULT_LANG = 'en_US';

/**
 * saveFunction — persists the refreshToken to localStorage on every SDK rotation.
 *
 * @param   {string}        refreshToken - Fresh refreshToken issued by the SDK.
 * @returns Promise that resolves once the token has been written (no-op on the server).
 */
const saveFunction = async (refreshToken: string): Promise<void> => {
  if (!refreshToken) {
    return;
  }
  if (typeof window === 'undefined') {
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
 * Always guard with {@link hasActiveSession} — each call hits `/refresh` and otherwise burns the current token.
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
 * Canonical login() pattern per MCP `tokens`: `AuthProvider.auth()` returns the tokens,
 * but the SDK does not push them into state itself — without `syncTokens` the next
 * auth-protected POST goes out without `Authorization` and fails with 400 (the SDK only retries on 401).
 * Use this instead of `reDefine` on login / OAuth callback; `reDefine` remains only
 * for restoring a session from localStorage on mount.
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
  const rec = result as Record<string, unknown>;
  return typeof rec.statusCode === 'number' && typeof rec.message === 'string';
};

type ImageField = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

/**
 * getImageUrl — normalises a OneEntry `image` attribute value into a URL string.
 *
 * The SDK returns an object for Products and an array for Pages/Blocks — this helper handles both shapes.
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
