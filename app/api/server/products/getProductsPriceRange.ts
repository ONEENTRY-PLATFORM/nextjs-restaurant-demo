import { getApi, getLang } from '@/app/api';
import { typeError } from '@/components/utils';

export type PriceRange = {
  min: number;
  max: number;
};

/**
 * Возвращает min/max цену по всем товарам каталога (`pageUrl = "services"`)
 * через `Products.getProductsPriceByPageUrl` — лёгкий вызов, который отдаёт
 * только `{id, price}[]`. Используется для динамической сборки чипов цены в
 * фильтре, чтобы границы соответствовали реальным товарам в админке OneEntry,
 * а не хардкоду.
 *
 * Graceful fallback на `{ min: 0, max: 0 }` при пустом каталоге или ошибке —
 * UI чипы тогда просто не покажутся.
 */
export const getProductsPriceRange = async (
  pageUrl = 'services',
  langCode?: string,
): Promise<PriceRange> => {
  try {
    const data = await getApi().Products.getProductsPriceByPageUrl(
      pageUrl,
      langCode || getLang(),
    );
    if (typeError(data)) {
      return { min: 0, max: 0 };
    }
    const prices = data.items
      .map((item) => Number(item.price))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (prices.length === 0) {
      return { min: 0, max: 0 };
    }
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  } catch {
    return { min: 0, max: 0 };
  }
};
