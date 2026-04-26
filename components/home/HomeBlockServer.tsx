import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';

import { getBlockProducts } from '@/app/api';

import HomeBlockSection from './HomeBlockSection';

const SECTION_BASE =
  'max-w-87.5 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto w-full';

/**
 * Async wrapper for {@link HomeBlockSection} that fetches a OneEntry block
 * by marker and forwards its title, curated product list, and layout
 * config (`quantity`, `countElementsPerRow`) to the renderer. Each home
 * block on `home_web` (e.g. `home_promo`, `recommended`) lives behind one
 * of these wrappers so `app/page.tsx` only needs to dispatch by
 * `block.identifier` and stays declarative.
 *
 * Returns `null` when the block has no products to display so empty
 * blocks don't leave a phantom section/title on the page.
 * @param   {object}                  props        - Component props.
 * @param   {string}                  props.marker - Block identifier (e.g. `recommended`).
 * @param   {string}                  [props.className] - Section className override.
 * @returns {Promise<JSX.Element|null>}              Block JSX, or `null` when empty.
 */
const HomeBlockServer = async ({
  marker,
  className,
}: {
  marker: string;
  className?: string;
}): Promise<JSX.Element | null> => {
  const data = await getBlockProducts(marker);
  if (data.isError || data.products.length === 0) return null;

  return (
    <HomeBlockSection
      title={data.title}
      products={data.products}
      countElementsPerRow={data.countElementsPerRow}
      className={className ?? `${SECTION_BASE} pt-3.75 md:pt-6.25 pb-1.25`}
      dict={{} as IAttributeValues}
    />
  );
};

export default HomeBlockServer;
