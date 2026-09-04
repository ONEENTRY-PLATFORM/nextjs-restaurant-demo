import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { getBlockByMarker } from '@/app/api/server/blocks/getBlockByMarker';

import ProductAnimations from './animations/ProductAnimations';
import GroupCard from './group-card/GroupCard';

/**
 * ProductsGroup — "buy together" section rendered from a OneEntry block by marker.
 *
 * @param   {object}      props        - Component props.
 * @param   {string}      props.marker - Block marker that supplies the title and product list.
 * @returns JSX of the section, or empty fragment on SDK error.
 */
const ProductsGroup = async ({ marker }: { marker: string }): Promise<JSX.Element> => {
  const { isError, block } = await getBlockByMarker(marker);

  if (isError || !block) {
    return <></>;
  }

  return (
    <ProductAnimations className="mb-8 flex flex-col max-md:max-w-full" index={4}>
      <h2 className="title_name max-md:max-w-full">
        {block.attributeValues?.together_title?.value as string | undefined}
      </h2>
      <div className="flex w-full flex-row flex-wrap items-stretch justify-start gap-2.5">
        {block.products?.map((product: IProductsEntity) => (
          <div
            key={product.id}
            className="relative box-border flex w-full shrink-0 flex-col md:w-[45%] xl:w-[32.5%]"
          >
            <GroupCard product={product} />
          </div>
        ))}
      </div>
    </ProductAnimations>
  );
};

export default ProductsGroup;
