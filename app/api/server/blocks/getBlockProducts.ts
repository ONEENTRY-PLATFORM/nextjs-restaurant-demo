import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Normalized payload returned by {@link getBlockProducts}: the block's
 * localized title, the array of attached products (already sliced to
 * `block.quantity` when present), and the column-count hint
 * (`block.countElementsPerRow`) that the renderer uses to size the grid.
 *
 * Different OneEntry block types stash products in different fields —
 * `product_block` uses `block.products`, `similar_products_block` uses
 * `block.similarProducts.items` — this helper hides that asymmetry from
 * callers.
 * @property {boolean}            isError             - SDK call failed.
 * @property {IError}             [error]             - Underlying SDK error.
 * @property {string}             title               - Block's localized title.
 * @property {IProductsEntity[]}  products            - Items, ordered as in CMS.
 * @property {number}             [quantity]          - Editor-set max items (already applied).
 * @property {number}             [countElementsPerRow] - Editor-set columns hint.
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
 * Fetch a Block by marker and extract products + layout config in a shape
 * the homepage renderer can consume without caring about the block type.
 *
 * The order in `products` is the editor-curated order (drag-and-drop in
 * OneEntry admin); we don't re-sort it.
 * @param   {string}                marker - Block identifier (e.g. `recommended`).
 * @returns {Promise<BlockProducts>}        Normalized block data; `products`
 *                                          is empty on any SDK error so callers
 *                                          can render conditionally without try/catch.
 */
export const getBlockProducts = async (
  marker: string,
): Promise<BlockProducts> => {
  try {
    const data = await api.Blocks.getBlockByMarker(marker);
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
      quantity: block.quantity,
      countElementsPerRow: block.countElementsPerRow,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e, title: '', products: [] };
  }
};
