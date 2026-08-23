import 'server-only';

import type { IProductsEntity } from 'oneentry/types';

import { getProductBlurDataURL, getProductImageUrl } from '@/app/api';
import getLqipPreview from '@/app/api/lqip/getLqipPreview';

/**
 * getProductBlurMap — base64 LQIP previews for a batch of products keyed by `product.id`.
 *
 * Prefers the inline blur OneEntry ships with each server-compressed image (`getProductBlurDataURL`) — no
 * asset fetch, no `sharp`. Only products whose image predates preview generation fall back to
 * `getLqipPreview`, which fetches the asset and reuses its in-process LRU so warm calls return immediately.
 *
 * Products without an image (or whose LQIP generation fails) are simply absent from the map —
 * callers should treat the lookup as optional.
 *
 * @param   {IProductsEntity[]} products - Products whose images need LQIP previews.
 * @returns Promise resolving to `{ [productId]: base64DataURI }`.
 */
const getProductBlurMap = async (products: IProductsEntity[]): Promise<Record<number, string>> => {
  const entries = await Promise.all(
    products.map(async product => {
      const inline = getProductBlurDataURL(product.attributeValues);
      if (inline) return [product.id, inline] as const;

      const src = getProductImageUrl(product.attributeValues);
      if (!src) return null;
      const blur = await getLqipPreview(src);
      return [product.id, blur] as const;
    })
  );
  return Object.fromEntries(entries.filter((e): e is readonly [number, string] => e !== null));
};

export default getProductBlurMap;
