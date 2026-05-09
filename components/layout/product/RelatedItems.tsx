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
 * RelatedItems — "related products" section at the bottom of a single dish page
 * (port of `Featured objects` from `static-html/details.html`).
 *
 * Supports two OneEntry data sources:
 * 1. Canonical `Products.getRelatedProductsById` (per-product `relatedIds`).
 * 2. A block of type `similar_products_block` attached to the product
 *    (for example, `similar_dishes`) — resolved via `getBlockProducts`,
 *    which knows how to read `block.similarProducts.items`.
 *
 * The first non-empty source in the listed order is used.
 * @param   {object}                 props           - props
 * @param   {number}                 props.productId - id of the current product
 * @param   {string[]}               [props.blocks]  - markers of blocks attached to the product (`product.blocks`)
 * @returns {Promise<JSX.Element>}                   section or empty fragment
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
        <h3 className="title_name max-md:max-w-full text-paper!">{title}</h3>
      </ProductAnimations>
      <CardsGridAnimations className="menu_items grid w-full grid-cols-2 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-2 max-md:[&>.menu_item]:w-full">
        {items.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} productsLimit={0} />
        ))}
      </CardsGridAnimations>
    </section>
  );
};

export default RelatedItems;
