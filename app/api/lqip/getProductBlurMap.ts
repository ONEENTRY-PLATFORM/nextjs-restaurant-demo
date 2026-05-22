import 'server-only';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import getLqipPreview from '@/app/api/lqip/getLqipPreview';

type CoverValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

const extractCoverUrl = (product: IProductsEntity): string | null => {
  const cover = product.attributeValues?.cover?.value as CoverValue;
  const src = Array.isArray(cover) ? cover[0]?.downloadLink : cover?.downloadLink;
  return src || null;
};

/**
 * getProductBlurMap — base64 LQIP previews for a batch of products keyed by `product.id`.
 *
 * Runs `getLqipPreview` in parallel for every product that has a `cover` image. The helper reuses the existing in-process LRU in `getLqipPreview`, so warm calls return immediately.
 *
 * Products without a cover image (or whose LQIP generation fails) are simply absent from the map — callers should treat the lookup as optional.
 *
 * @param   {IProductsEntity[]} products - Products whose covers need LQIP previews.
 * @returns Promise resolving to `{ [productId]: base64DataURI }`.
 */
const getProductBlurMap = async (products: IProductsEntity[]): Promise<Record<number, string>> => {
  const entries = await Promise.all(
    products.map(async product => {
      const src = extractCoverUrl(product);
      if (!src) return null;
      const blur = await getLqipPreview(src);
      return [product.id, blur] as const;
    })
  );
  return Object.fromEntries(entries.filter((e): e is readonly [number, string] => e !== null));
};

export default getProductBlurMap;
