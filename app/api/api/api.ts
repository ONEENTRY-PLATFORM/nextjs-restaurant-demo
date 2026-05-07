import { defineOneEntry } from 'oneentry';
import type { IError } from 'oneentry/dist/base/utils';

const PROJECT_URL = (process.env.NEXT_PUBLIC_ONEENTRY_URL ||
  process.env.NEXT_PUBLIC_PROJECT_URL) as string;
const APP_TOKEN = (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN ||
  process.env.NEXT_PUBLIC_APP_TOKEN) as string;

const DEFAULT_LANG = 'en_US';

/**
 * Persists the refreshToken to localStorage on every SDK rotation.
 * @param   {string}        refreshToken - Fresh refreshToken issued by the SDK.
 * @returns {Promise<void>}
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

/**
 * Mutable SDK instance. Recreated via {@link reDefine} on login / langCode change.
 * Exported as `api` for backwards compatibility with existing imports.
 */
export let api = defineOneEntry(PROJECT_URL, {
  langCode: DEFAULT_LANG,
  token: APP_TOKEN,
  auth: {
    saveFunction,
  },
});

/**
 * Getter for the current SDK instance. Prefer this over `api` —
 * guarantees the caller always sees the up-to-date instance even after {@link reDefine}.
 * @returns {ReturnType<typeof defineOneEntry>} Current api instance.
 */
export const getApi = (): ReturnType<typeof defineOneEntry> => api;

/**
 * Recreates the SDK instance with a (possibly) new refreshToken and langCode.
 *
 * ⚠️ Always guard with {@link hasActiveSession} — each call hits `/refresh`
 * and would otherwise burn the current token.
 * @param   {string}        refreshToken - Refresh token from localStorage.
 * @param   {string}        [langCode]   - Current language code (defaults to `en_US`).
 * @returns {Promise<void>}
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
 * Whether the current SDK instance holds an active accessToken.
 * @returns {boolean}
 */
export const hasActiveSession = (): boolean => {
  const provider = api.AuthProvider as unknown as {
    state?: { accessToken?: string };
  };
  return Boolean(provider?.state?.accessToken);
};

/**
 * Writes both tokens directly into the state of the current SDK instance. The
 * canonical `login()` pattern per MCP `tokens` rules: the `AuthProvider.auth()`
 * response contains `accessToken`+`refreshToken`, and without `syncTokens`
 * the very next auth-protected request will go out without `Authorization`,
 * get a 400 (`postFormsData`, `createOrder`) and fail — the SDK only retries 401.
 *
 * Use instead of `reDefine` at login / OAuth-callback time. `reDefine` is kept
 * only for restoring a session from localStorage on mount.
 * @param {string} accessToken  - Access JWT from `auth()`.
 * @param {string} refreshToken - Refresh token from `auth()`.
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
 * Current langCode of the SDK instance.
 * @returns {string} Language code, e.g. `en_US`.
 */
export const getLang = (): string => {
  const cfg = (api as unknown as { config?: { langCode?: string } }).config;
  return cfg?.langCode || DEFAULT_LANG;
};

/**
 * Type guard for SDK responses — returns `true` if the value is an `IError`.
 * @param   {unknown} result - SDK response to check.
 * @returns {boolean}
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
 * Normalizes a OneEntry `image` attribute value into a URL string.
 *
 * The SDK returns an object for Products and an array for Pages/Blocks —
 * this helper handles both shapes.
 * @param   {ImageField} value - `attributeValues.<marker>.value`.
 * @returns {string}           Download URL, or an empty string.
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
