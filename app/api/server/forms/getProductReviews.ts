import { unstable_noStore } from 'next/cache';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';

import { getApi, getLang, isError } from '@/app/api';

const FORM_MARKER = 'review_form';
// `moduleFormConfigs[0].id` формы `review_form` = 2 (проверено через SDK). При пересоздании
// конфига первый id из `getFormByMarker` всегда побеждает над этим дефолтом.
const DEFAULT_MODULE_CONFIG_ID = 2;
const REVIEWS_LIMIT = 50;

/** RawReviewItem — запись OneEntry FormsData из `getFormsDataByMarker` (слабо типизирована — SDK не экспортирует стабильный тип). */
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

/** ProductReview — нормализованная запись отзыва для `<ProductReviewsList />`. */
export interface ProductReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
}

/**
 * readPlainText — plain-текст из полиморфного `formData[].value` (SDK даёт `[{ plainValue }]` для `text`, строку для примитивов).
 * @param   {unknown} value - Сырое `formData[].value`.
 * @returns {string}        Plain-текст.
 */
const readPlainText = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0] as { plainValue?: unknown } | undefined;
    return typeof first?.plainValue === 'string' ? first.plainValue : '';
  }
  return typeof value === 'string' ? value : '';
};

/**
 * readNumber — приводит `formData[].value` к числу для рейтинга (`0` для нечисловых).
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
 * getProductReviews — одобренные отзывы продукта из OneEntry FormsData по `entityIdentifier`.
 *
 * `unstable_noStore()` отключает route cache — свежие отзывы появляются без ручной revalidation.
 * Фильтр `status: ['approved']` совпадает с publish-статусом server action `submitReview`.
 * Возвращаются только верхнеуровневые (`parentId === null`) — вложенные ответы UI не рендерит.
 * Graceful fallback на пустой массив при любой ошибке SDK ("Resource is closed", см. MISMATCH-LOG §C).
 * @param   {number}                    productId - Id продукта (становится `entityIdentifier`).
 * @returns {Promise<ProductReview[]>}            Отзывы верхнего уровня, сначала новые.
 */
export const getProductReviews = async (productId: number): Promise<ProductReview[]> => {
  unstable_noStore();

  try {
    const lang = getLang();

    const form = await getApi().Forms.getFormByMarker(FORM_MARKER);
    const formMeta = form as IFormsEntity as {
      moduleFormConfigs?: Array<{ id?: number }>;
    };
    const formModuleConfigId = formMeta?.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

    const data = await getApi().FormData.getFormsDataByMarker(
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
      REVIEWS_LIMIT
    );

    if (isError(data)) {
      return [];
    }

    const items = (data as unknown as { items?: RawReviewItem[] })?.items ?? [];

    return items
      .filter(item => item.parentId === null)
      .map<ProductReview>(item => {
        const ratingField = item.formData?.find(f => f.marker === 'review_rating');
        const textField = item.formData?.find(f => f.marker === 'review_text');
        return {
          id: String(item.id),
          author: item.userIdentifier?.trim() || 'Anonymous',
          date: item.time ? new Date(item.time).toLocaleDateString('en-US') : '',
          rating: readNumber(ratingField?.value),
          text: readPlainText(textField?.value),
        };
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  } catch {
    return [];
  }
};
