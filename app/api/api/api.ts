import { defineOneEntry } from 'oneentry';
import type { IError } from 'oneentry/dist/base/utils';

const PROJECT_URL = (process.env.NEXT_PUBLIC_ONEENTRY_URL ||
  process.env.NEXT_PUBLIC_PROJECT_URL) as string;
const APP_TOKEN = (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN ||
  process.env.NEXT_PUBLIC_APP_TOKEN) as string;

const DEFAULT_LANG = 'en_US';

/**
 * saveFunction — сохраняет refreshToken в localStorage при каждой ротации SDK.
 * @param   {string}        refreshToken - Свежий refreshToken от SDK.
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

/** Мутируемый SDK-инстанс. Пересоздаётся через {@link reDefine} при логине / смене langCode. */
export let api = defineOneEntry(PROJECT_URL, {
  langCode: DEFAULT_LANG,
  token: APP_TOKEN,
  auth: {
    saveFunction,
  },
});

/**
 * getApi — геттер актуального SDK-инстанса. Предпочтительнее, чем `api`: всегда
 * отдаёт свежий инстанс после {@link reDefine}.
 * @returns {ReturnType<typeof defineOneEntry>} Текущий api-инстанс.
 */
export const getApi = (): ReturnType<typeof defineOneEntry> => api;

/**
 * reDefine — пересоздаёт SDK-инстанс с (возможно) новым refreshToken и langCode.
 *
 * Всегда оборачивай через {@link hasActiveSession} — каждый вызов идёт на `/refresh` и иначе сжигает текущий токен.
 * @param   {string}        refreshToken - Refresh-токен из localStorage.
 * @param   {string}        [langCode]   - Текущий язык (по умолчанию `en_US`).
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
 * hasActiveSession — есть ли в текущем SDK-инстансе валидный accessToken.
 * @returns {boolean}
 */
export const hasActiveSession = (): boolean => {
  const provider = api.AuthProvider as unknown as {
    state?: { accessToken?: string };
  };
  return Boolean(provider?.state?.accessToken);
};

/**
 * syncTokens — записывает оба токена прямо в state текущего SDK-инстанса.
 *
 * Канонический login()-паттерн по MCP `tokens`: `AuthProvider.auth()` возвращает токены,
 * но SDK не кладёт их в state сам — без `syncTokens` следующий auth-protected POST уйдёт
 * без `Authorization` и упадёт с 400 (SDK ретраит только 401).
 * Используется вместо `reDefine` при логине / OAuth-callback; `reDefine` остаётся только
 * для восстановления сессии из localStorage на mount.
 * @param {string} accessToken  - Access JWT из `auth()`.
 * @param {string} refreshToken - Refresh-токен из `auth()`.
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
 * getLang — текущий langCode SDK-инстанса.
 * @returns {string} Код языка, напр. `en_US`.
 */
export const getLang = (): string => {
  const cfg = (api as unknown as { config?: { langCode?: string } }).config;
  return cfg?.langCode || DEFAULT_LANG;
};

/**
 * isError — type guard для SDK-ответов: `true`, если значение — `IError`.
 * @param   {unknown} result - SDK-ответ для проверки.
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
 * getImageUrl — нормализует значение OneEntry-атрибута `image` в URL-строку.
 *
 * SDK возвращает объект для Products и массив для Pages/Blocks — хелпер обрабатывает обе формы.
 * @param   {ImageField} value - `attributeValues.<marker>.value`.
 * @returns {string}           Download URL или пустая строка.
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
