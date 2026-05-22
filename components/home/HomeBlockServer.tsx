import type { JSX } from 'react';

import { getBlockProducts } from '@/app/api';
import getProductBlurMap from '@/app/api/lqip/getProductBlurMap';

import HomeBlockSection from './HomeBlockSection';

/**
 * HomeBlockServer — async wrapper over {@link HomeBlockSection}: fetches a OneEntry block by marker.
 *
 * @param   {object} props             - Component props.
 * @param   {string} props.marker      - Block marker.
 * @param   {string} [props.className] - Override for the section className.
 * @param   {number} [props.limit]     - Cap on the number of products.
 * @returns JSX of the block, or `null` when the block is empty / errored.
 */
const HomeBlockServer = async ({
  marker,
  className,
  limit,
}: {
  marker: string;
  className?: string;
  limit?: number;
}): Promise<JSX.Element | null> => {
  const data = await getBlockProducts(marker);
  if (data.isError || data.products.length === 0) return null;

  const products = limit ? data.products.slice(0, limit) : data.products;
  const blurMap = await getProductBlurMap(products);

  return (
    <HomeBlockSection
      title={data.title}
      products={products}
      countElementsPerRow={data.countElementsPerRow}
      className={className ?? 'section_layout'}
      blurMap={blurMap}
    />
  );
};

export default HomeBlockServer;
