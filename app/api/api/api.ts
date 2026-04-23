import { defineOneEntry } from 'oneentry';
import type { IError } from 'oneentry/dist/base/utils';

const PROJECT_URL = (process.env.NEXT_PUBLIC_ONEENTRY_URL ||
  process.env.NEXT_PUBLIC_PROJECT_URL) as string;
const APP_TOKEN = (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN ||
  process.env.NEXT_PUBLIC_APP_TOKEN) as string;

const DEFAULT_LANG = 'en_US';

/**
 * Save refreshToken to localStorage on each SDK rotation.
 *
 * Called automatically by the SDK auth layer — no manual token juggling required.
 * @param   {string}        refreshToken - Fresh refreshToken produced by the SDK.
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
 * Mutable SDK instance. Recreated by {@link reDefine} on login / langCode change.
 * Exported as `api` for backward compatibility with existing imports.
 */
export let api = defineOneEntry(PROJECT_URL, {
  langCode: DEFAULT_LANG,
  token: APP_TOKEN,
  auth: {
    saveFunction,
  },
});

/**
 * Current SDK instance getter. Prefer this over `api` — ensures the caller
 * always sees the latest instance even after {@link reDefine}.
 * @returns {ReturnType<typeof defineOneEntry>} Current api instance.
 */
export const getApi = (): ReturnType<typeof defineOneEntry> => api;

/**
 * Recreate the SDK instance with a (possibly) new refreshToken and langCode.
 *
 * ⚠️ Always guard with {@link hasActiveSession} — each call hits `/refresh`
 * and would otherwise burn the current token.
 * @param   {string}        refreshToken - Refresh token from localStorage.
 * @param   {string}        [langCode]   - Current language code (defaults to `en_US`).
 * @returns {Promise<void>}
 */
export async function reDefine(
  refreshToken: string,
  langCode?: string,
): Promise<void> {
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
 * Whether the current SDK instance carries an active accessToken.
 *
 * Must be checked before {@link reDefine} to avoid overwriting a live session.
 * @returns {boolean}
 */
export const hasActiveSession = (): boolean => {
  const cfg = (
    api as unknown as { config?: { auth?: { accessToken?: string } } }
  ).config;
  return Boolean(cfg?.auth?.accessToken);
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

type ImageField =
  | { downloadLink?: string }
  | Array<{ downloadLink?: string }>
  | null
  | undefined;

/**
 * Normalize the OneEntry `image` attribute value to a URL string.
 *
 * The SDK returns an object for Products and an array for Pages/Blocks —
 * this helper handles both shapes.
 * @param   {ImageField} value - `attributeValues.<marker>.value`.
 * @returns {string}           Download URL or empty string.
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
