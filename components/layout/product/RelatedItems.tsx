import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getBlockProducts, getRelatedProductsById } from '@/app/api';
import { t } from '@/app/dictionaries';

import CardsGridAnimations from '../products-grid/animations/CardsGridAnimations';
import ProductCard from '../products-grid/components/product-card/ProductCard';
import ProductAnimations from './animations/ProductAnimations';

/** Markers handled elsewhere (e.g. ProductsGroup) — do not try them as similar. */
const NON_SIMILAR_BLOCK_MARKERS = new Set<string>(['similar_dishes']);

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

  const title = await t('featured_objects', 'Featured objects');

  return (
    <section className="flex flex-col max-md:max-w-full pt-15">
      <ProductAnimations className={''} index={0}>
        <h3 className="title_name mb-3 max-md:max-w-full text-paper!">{title}</h3>
      </ProductAnimations>
      <CardsGridAnimations className="menu_items grid w-full grid-cols-2 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 max-md:[&>.menu_item]:w-full">
        {items.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} productsLimit={0} />
        ))}
      </CardsGridAnimations>
    </section>
  );
};

export default RelatedItems;
