import { defineOneEntry } from 'oneentry';
import type { IError } from 'oneentry/dist/base/utils';

const PROJECT_URL = (process.env.NEXT_PUBLIC_ONEENTRY_URL ||
  process.env.NEXT_PUBLIC_PROJECT_URL) as string;
const APP_TOKEN = (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN ||
  process.env.NEXT_PUBLIC_APP_TOKEN) as string;

const DEFAULT_LANG = 'en_US';

/**
 * Сохраняет refreshToken в localStorage при каждой ротации SDK.
 * @param   {string}        refreshToken - Свежий refreshToken, выданный SDK.
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
 * Мутабельный экземпляр SDK. Пересоздаётся через {@link reDefine} при логине / смене langCode.
 * Экспортируется как `api` для обратной совместимости с существующими импортами.
 */
export let api = defineOneEntry(PROJECT_URL, {
  langCode: DEFAULT_LANG,
  token: APP_TOKEN,
  auth: {
    saveFunction,
  },
});

/**
 * Геттер текущего экземпляра SDK. Предпочтительнее использовать его, а не `api` —
 * гарантирует, что вызывающая сторона всегда видит актуальный экземпляр даже после {@link reDefine}.
 * @returns {ReturnType<typeof defineOneEntry>} Текущий экземпляр api.
 */
export const getApi = (): ReturnType<typeof defineOneEntry> => api;

/**
 * Пересоздаёт экземпляр SDK с (возможно) новым refreshToken и langCode.
 *
 * ⚠️ Всегда защищай через {@link hasActiveSession} — каждый вызов идёт в `/refresh`
 * и иначе сжёг бы текущий токен.
 * @param   {string}        refreshToken - Refresh token из localStorage.
 * @param   {string}        [langCode]   - Текущий код языка (по умолчанию `en_US`).
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
 * Содержит ли текущий экземпляр SDK активный accessToken.
 *
 * Должен проверяться перед {@link reDefine}, чтобы не перезаписать живую сессию.
 * @returns {boolean}
 */
export const hasActiveSession = (): boolean => {
  const cfg = (
    api as unknown as { config?: { auth?: { accessToken?: string } } }
  ).config;
  return Boolean(cfg?.auth?.accessToken);
};

/**
 * Текущий langCode экземпляра SDK.
 * @returns {string} Код языка, например `en_US`.
 */
export const getLang = (): string => {
  const cfg = (api as unknown as { config?: { langCode?: string } }).config;
  return cfg?.langCode || DEFAULT_LANG;
};

/**
 * Type guard для ответов SDK — возвращает `true`, если значение является `IError`.
 * @param   {unknown} result - Ответ SDK для проверки.
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
 * Нормализует значение атрибута `image` OneEntry в URL-строку.
 *
 * SDK возвращает объект для Products и массив для Pages/Blocks —
 * этот хелпер обрабатывает обе формы.
 * @param   {ImageField} value - `attributeValues.<marker>.value`.
 * @returns {string}           URL для скачивания или пустая строка.
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
