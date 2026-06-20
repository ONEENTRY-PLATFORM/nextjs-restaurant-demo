import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IBlockEntity } from 'oneentry/dist/blocks/blocksInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/** BlockProducts — payload of {@link getBlockProducts}: title, products (sliced to `block.quantity`) and a column-count hint. */
export interface BlockProducts {
  isError: boolean;
  error?: IError;
  title: string;
  products: IProductsEntity[];
  quantity?: number;
  countElementsPerRow?: number;
}

const fetchBlockProducts = unstable_cache(
  async (marker: string): Promise<BlockProducts> => {
    try {
      const data = await getApi().Blocks.getBlockByMarker(marker);
      if (typeError(data)) {
        return { isError: true, error: data, title: '', products: [] };
      }
      const block = data as IBlockEntity;
      const title = block.localizeInfos?.title ?? marker;
      // similarProducts is always IProductsResponse ({ items, total }), never a bare array.
      const raw = block.products ?? block.similarProducts?.items ?? [];
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
  },
  ['oneentry-getBlockProducts'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-blocks', 'oneentry-products'] }
);

/**
 * getBlockProducts — block by marker plus products and layout config in normalised form.
 *
 * Composed cache (see {@link getPageByUrl}): `unstable_cache` for 60 s
 * cross-request caching, React `cache()` for in-render deduplication.
 *
 * Returns empty `products` on SDK error.
 *
 * @param   {string} marker - Block marker (e.g. `recommended`).
 * @returns Normalised block data.
 */
export const getBlockProducts = cache(
  async (marker: string): Promise<BlockProducts> => fetchBlockProducts(marker)
);
