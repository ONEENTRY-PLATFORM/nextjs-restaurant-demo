import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * BlockProducts — payload {@link getBlockProducts}: title, products (обрезанные до `block.quantity`)
 * и подсказка о количестве колонок. Скрывает асимметрию между `product_block` (`block.products`)
 * и `similar_products_block` (`block.similarProducts.items`).
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
 * getBlockProducts — блок по маркеру + продукты и layout-конфиг в нормализованной форме.
 *
 * Порядок в `products` — заданный редактором (drag-and-drop в admin), не пересортируем.
 * При любой ошибке SDK возвращает пустой `products`, чтобы вызывающие рендерили условно без try/catch.
 * @param   {string}                marker - Идентификатор блока (например, `recommended`).
 * @returns {Promise<BlockProducts>}        Нормализованные данные блока.
 */
export const getBlockProducts = cache(async (marker: string): Promise<BlockProducts> => {
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
      typeof block.quantity === 'number' && block.quantity > 0 ? raw.slice(0, block.quantity) : raw;
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
});
