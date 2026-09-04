import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import getProductBlurMap from '@/app/api/lqip/getProductBlurMap';
import { getBlockProducts } from '@/app/api/server/blocks/getBlockProducts';
import { getRelatedProductsById } from '@/app/api/server/products/getRelatedProductsById';
import { t } from '@/app/dictionaries';
import { BLOCKS } from '@/app/utils/constants';

import CardsGridAnimations from '../products-grid/animations/CardsGridAnimations';
import ProductCard from '../products-grid/components/product-card/ProductCard';
import ProductAnimations from './animations/ProductAnimations';

/** Markers handled elsewhere (e.g. ProductsGroup) — do not try them as similar. */
const NON_SIMILAR_BLOCK_MARKERS = new Set<string>([BLOCKS.similarDishes]);

/**
 * RelatedItems — "related products" section at the bottom of a single dish page.
 *
 * Tries `Products.getRelatedProductsById` first; falls back to a `similar_products_block` attached to the product. Uses the first non-empty source.
 *
 * @param   {object}      props           - Component props.
 * @param   {number}      props.productId - Id of the current product (excluded from the result).
 * @param   {string[]}    [props.blocks]  - Markers of blocks attached to the product (`product.blocks`), used as fallback source.
 * @returns JSX of the section, or empty fragment when no related items are available.
 */
const RelatedItems = async ({
  productId,
  blocks,
}: {
  productId: number;
  blocks?: string[];
}): Promise<JSX.Element> => {
  let items: IProductsEntity[] = [];

  const canonical = await getRelatedProductsById(productId);
  if (!canonical.isError && canonical.products?.length) {
    items = canonical.products.filter(p => p.id !== productId);
  }

  if (!items.length && blocks?.length) {
    for (const marker of blocks) {
      if (NON_SIMILAR_BLOCK_MARKERS.has(marker)) continue;
      const block = await getBlockProducts(marker);
      if (!block.isError && block.products.length) {
        items = block.products.filter(p => p.id !== productId);
        if (items.length) break;
      }
    }
  }

  if (!items.length) {
    return <></>;
  }

  const [title, blurMap] = await Promise.all([
    t('featured_objects', 'Featured objects'),
    getProductBlurMap(items),
  ]);

  return (
    <section className="flex flex-col pt-15 max-md:max-w-full">
      <ProductAnimations className={''} index={0}>
        <h3 className="title_name mb-3 text-paper! max-md:max-w-full">{title}</h3>
      </ProductAnimations>
      <CardsGridAnimations className="menu_items">
        {items.map((product, i) => {
          const blur = blurMap[product.id];
          return (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              productsLimit={0}
              {...(blur ? { blurDataURL: blur } : {})}
            />
          );
        })}
      </CardsGridAnimations>
    </section>
  );
};

export default RelatedItems;
