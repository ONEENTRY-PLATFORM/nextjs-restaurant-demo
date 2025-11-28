import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, Key } from 'react';

import { getBlockByMarker } from '@/app/api';

import CardsGridAnimations from '../products-grid/animations/CardsGridAnimations';
import ProductCard from '../products-grid/components/product-card/ProductCard';
import ProductAnimations from './animations/ProductAnimations';

/**
 * RelatedItems component
 */
const RelatedItems = async ({
  marker,
  dict,
}: {
  marker: string;
  dict: IAttributeValues;
}): Promise<JSX.Element> => {
  // Get related items block from api
  const { isError, block } = await getBlockByMarker(marker);

  if (isError || !block || !block.similarProducts) {
    return <></>;
  }

  return (
    <section className="flex flex-col max-md:max-w-full">
      <ProductAnimations className={''} index={0}>
        <h3 className="mb-5 text-base uppercase leading-5 text-neutral-600 max-md:max-w-full">
          {block.attributeValues['en_US']?.block_title?.value ||
            block.attributeValues?.block_title?.value}
        </h3>
      </ProductAnimations>
      <CardsGridAnimations className="grid w-full grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 max-md:w-full">
        {block?.similarProducts?.items?.map(
          (product: IProductsEntity, i: Key | number) => {
            return (
              <ProductCard
                key={i}
                product={product}
                dict={dict}
                index={i as number}
                pagesLimit={0}
              />
            );
          },
        )}
      </CardsGridAnimations>
    </section>
  );
};

export default RelatedItems;
