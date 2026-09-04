import type { JSX } from 'react';

import getProductBlurMap from '@/app/api/lqip/getProductBlurMap';
import { getBlockProducts } from '@/app/api/server/blocks/getBlockProducts';
import { getProducts } from '@/app/api/server/products/getProducts';
import { t } from '@/app/dictionaries';

import HomeBlockSection from './HomeBlockSection';

/**
 * HomeBlockServer — async wrapper over {@link HomeBlockSection}: fetches a OneEntry block by marker.
 *
 * When the block yields no products and `fallbackToCatalog` is set, it backfills with the first
 * catalog products so the section never disappears (same "never empty" approach as
 * `getRecommendations`). The home `recommended` block is a `similar_products_block`, and its
 * `similarProducts` payload does reach the anonymous app-token used during home SSR (checked
 * 2026-08-03: 8 items out of a `totalFound` pool of 51), so the fallback only covers a block
 * that is genuinely empty.
 *
 * @param   {object}  props                     - Component props.
 * @param   {string}  props.marker              - Block marker.
 * @param   {string}  [props.className]         - Override for the section className.
 * @param   {number}  [props.limit]             - Cap on the number of products.
 * @param   {boolean} [props.fallbackToCatalog] - Backfill with catalog products when the block is empty.
 * @returns JSX of the block, or `null` when the block is empty and no fallback is requested.
 */
const HomeBlockServer = async ({
  marker,
  className,
  limit,
  fallbackToCatalog = false,
}: {
  marker: string;
  className?: string;
  limit?: number;
  fallbackToCatalog?: boolean;
}): Promise<JSX.Element | null> => {
  const data = await getBlockProducts(marker);
  let products = data.isError ? [] : data.products;
  let title = data.title;

  // Empty can mean an empty block OR a swallowed sub-resource error (e.g. the `recommended`
  // similar_products_block returns `similarProducts: 403` anonymously). Backfill so the row renders.
  if (products.length === 0 && fallbackToCatalog) {
    const fallback = await getProducts({ limit: limit ?? 8, offset: 0 });
    products = fallback.products ?? [];
    if (!title) title = await t('recommended_for_you', 'Recommended for you');
  }

  if (products.length === 0) return null;

  const sliced = limit ? products.slice(0, limit) : products;
  const blurMap = await getProductBlurMap(sliced);

  return (
    <HomeBlockSection
      title={title}
      products={sliced}
      countElementsPerRow={data.countElementsPerRow}
      className={className ?? 'section_layout'}
      blurMap={blurMap}
    />
  );
};

export default HomeBlockServer;
