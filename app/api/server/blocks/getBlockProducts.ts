import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * BlockProducts — payload of {@link getBlockProducts}: title, products (sliced to `block.quantity`)
 * and a column-count hint. Hides the asymmetry between `product_block` (`block.products`)
 * and `similar_products_block` (`block.similarProducts.items`).
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
 * getBlockProducts — block by marker plus products and layout config in normalised form.
 *
 * The order in `products` is the one set by the editor (drag-and-drop in admin) — do not re-sort.
 * On any SDK error returns empty `products`, so callers can render conditionally without try/catch.
 * @param   {string}                marker - Block marker (e.g. `recommended`).
 * @returns {Promise<BlockProducts>}        Normalised block data.
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
