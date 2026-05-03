import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Нормализованный payload, возвращаемый {@link getBlockProducts}: локализованный
 * заголовок блока, массив прикреплённых продуктов (уже обрезанный до
 * `block.quantity`, если задан) и подсказка о количестве колонок
 * (`block.countElementsPerRow`), которую рендерер использует для размера сетки.
 *
 * Разные типы блоков OneEntry хранят продукты в разных полях —
 * `product_block` использует `block.products`, `similar_products_block` —
 * `block.similarProducts.items`. Этот хелпер скрывает асимметрию от
 * вызывающих.
 * @property {boolean}            isError             - Вызов SDK завершился ошибкой.
 * @property {IError}             [error]             - Исходная ошибка SDK.
 * @property {string}             title               - Локализованный заголовок блока.
 * @property {IProductsEntity[]}  products            - Элементы в порядке, заданном в CMS.
 * @property {number}             [quantity]          - Заданный редактором максимум элементов (уже применён).
 * @property {number}             [countElementsPerRow] - Заданная редактором подсказка о колонках.
 */
export interface BlockProducts {
  isError: boolean;
  error?: IError;
  title: string;
  products: IProductsEntity[];
  quantity?: number;
  countElementsPerRow?: number;
}

/**
 * Получает блок по маркеру и извлекает продукты + конфиг раскладки в форме,
 * которую рендерер главной страницы может использовать без знания типа блока.
 *
 * Порядок в `products` — это порядок, заданный редактором (drag-and-drop в
 * OneEntry admin); мы его не пересортировываем.
 * @param   {string}                marker - Идентификатор блока (например, `recommended`).
 * @returns {Promise<BlockProducts>}        Нормализованные данные блока; `products`
 *                                          пуст при любой ошибке SDK, чтобы вызывающие
 *                                          могли рендерить условно без try/catch.
 */
export const getBlockProducts = async (
  marker: string,
): Promise<BlockProducts> => {
  try {
    const data = await getApi().Blocks.getBlockByMarker(marker);
    if (typeError(data)) {
      return { isError: true, error: data, title: '', products: [] };
    }
    const block = data as unknown as {
      localizeInfos?: { title?: string };
      products?: IProductsEntity[];
      similarProducts?: { items?: IProductsEntity[] } | IProductsEntity[];
      quantity?: number;
      countElementsPerRow?: number;
    };
    const title = block.localizeInfos?.title ?? marker;
    const raw =
      block.products ??
      (Array.isArray(block.similarProducts)
        ? block.similarProducts
        : (block.similarProducts?.items ?? [])) ??
      [];
    const products =
      typeof block.quantity === 'number' && block.quantity > 0
        ? raw.slice(0, block.quantity)
        : raw;
    return {
      isError: false,
      title,
      products,
      ...(block.quantity !== undefined && { quantity: block.quantity }),
      ...(block.countElementsPerRow !== undefined && {
        countElementsPerRow: block.countElementsPerRow,
      }),
    };
  } catch (e: unknown) {
    return { isError: true, error: e as IError, title: '', products: [] };
  }
};
