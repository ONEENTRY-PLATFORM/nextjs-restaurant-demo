import { unstable_noStore } from 'next/cache';

import { getApi, getLang, isError } from '@/app/api';

const FORM_MARKER = 'review_form';
// `moduleFormConfigs[0].id` формы `review_form` в OneEntry = 2 (проверено
// через SDK Forms.getFormByMarker). Если админ пересоздаст конфиг —
// первый id из `getFormByMarker` всегда побеждает над этим дефолтом.
const DEFAULT_MODULE_CONFIG_ID = 2;
const REVIEWS_LIMIT = 500;

/**
 * Одна запись OneEntry FormsData, возвращаемая `getFormsDataByMarker`.
 * Слабо типизирована, потому что форма ответа SDK не экспортируется как
 * стабильный тип — описаны только те поля, которые мы реально используем.
 * @property {number}      id              - Внутренний id записи FormsData.
 * @property {number|null} parentId        - Id родительской записи для вложенных комментариев (null = отзыв верхнего уровня).
 * @property {string}      [userIdentifier] - Id автора, разрешённый SDK (выставляется при отправке под авторизованной сессией).
 * @property {string}      [time]          - ISO-таймстамп отправки.
 * @property {Array}       formData        - Отправленные значения полей, ключи — маркеры.
 */
export interface RawReviewItem {
  id: number;
  parentId: number | null;
  userIdentifier?: string;
  time?: string;
  formData?: Array<{
    marker: string;
    type?: string;
    value?: unknown;
  }>;
}

/**
 * Нормализованная запись отзыва, которую использует `<ProductReviewsList />`.
 * @property {string} id     - Стабильный ключ.
 * @property {string} author - Отображаемое имя (`userIdentifier` или "Anonymous").
 * @property {string} date   - Дата, отформатированная по локали.
 * @property {number} rating - Рейтинг звёздами 0–5.
 * @property {string} text   - Тело отзыва в plain-text.
 */
export interface ProductReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
}

/**
 * Извлекает plain-значение текстового поля OneEntry из полиморфной формы
 * `formData[].value` — SDK возвращает массив `[{ plainValue }]` для полей
 * `text` и строку для примитивов.
 * @param   {unknown} value - Сырое `formData[].value`.
 * @returns {string}        Содержимое в виде plain-текста.
 */
const readPlainText = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0] as { plainValue?: unknown } | undefined;
    return typeof first?.plainValue === 'string' ? first.plainValue : '';
  }
  return typeof value === 'string' ? value : '';
};

/**
 * Приводит `formData[].value` к числу для полей рейтинга.
 * Возвращает `0` для отсутствующих / не-числовых значений.
 * @param   {unknown} value - Сырое `formData[].value`.
 * @returns {number}        Числовой рейтинг.
 */
const readNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/**
 * Получает одобренные отзывы о продукте из OneEntry FormsData по `entityIdentifier`.
 *
 * Повторяет паттерн чтения из `ReviewsSectionServer` в `oneentry-next-shop`:
 * - `unstable_noStore()` отключает кэширование маршрута, чтобы только что отправленные
 *   отзывы появлялись при следующем рендере без ручной revalidation;
 * - фильтр `status: ['approved']` соответствует publish-статусу, который выставляет
 *   server action `submitReview`;
 * - возвращаются только записи верхнего уровня (`parentId === null`) — вложенные
 *   ответы текущим UI не рендерятся.
 *
 * Падает на пустой массив при любой ошибке SDK или отсутствии данных, чтобы
 * компонент мог отрендерить `null` (согласно правилу graceful-fallback на
 * "Resource is closed" в `MISMATCH-LOG.md` §C).
 * @param   {number}                    productId - Id отзываемого продукта (становится `entityIdentifier`).
 * @returns {Promise<ProductReview[]>}            Отзывы верхнего уровня, сначала новые.
 */
export const getProductReviews = async (
  productId: number,
): Promise<ProductReview[]> => {
  unstable_noStore();

  try {
    const api = getApi();
    const lang = getLang();

    const form = await api.Forms.getFormByMarker(FORM_MARKER);
    const formMeta = form as unknown as {
      moduleFormConfigs?: Array<{ id?: number }>;
    };
    const formModuleConfigId =
      formMeta?.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

    const data = await api.FormData.getFormsDataByMarker(
      FORM_MARKER,
      formModuleConfigId,
      {
        entityIdentifier: productId,
        userIdentifier: '',
        status: ['approved'],
        dateFrom: '',
        dateTo: '',
      },
      1,
      lang,
      0,
      REVIEWS_LIMIT,
    );

    if (isError(data)) {
      return [];
    }

    const items = (data as unknown as { items?: RawReviewItem[] })?.items ?? [];

    return items
      .filter((item) => item.parentId === null)
      .map<ProductReview>((item) => {
        const ratingField = item.formData?.find(
          (f) => f.marker === 'review_rating',
        );
        const textField = item.formData?.find(
          (f) => f.marker === 'review_text',
        );
        return {
          id: String(item.id),
          author: item.userIdentifier?.trim() || 'Anonymous',
          date: item.time
            ? new Date(item.time).toLocaleDateString('en-US')
            : '',
          rating: readNumber(ratingField?.value),
          text: readPlainText(textField?.value),
        };
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  } catch {
    return [];
  }
};
