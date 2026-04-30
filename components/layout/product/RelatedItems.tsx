import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getBlockProducts, getRelatedProductsById } from '@/app/api';

import CardsGridAnimations from '../products-grid/animations/CardsGridAnimations';
import ProductCard from '../products-grid/components/product-card/ProductCard';
import ProductAnimations from './animations/ProductAnimations';

/** Markers handled elsewhere (e.g. ProductsGroup) — не пробуем как similar. */
const NON_SIMILAR_BLOCK_MARKERS = new Set<string>(['multiply_items_offer']);

/**
 * RelatedItems — секция «похожих товаров» внизу страницы одного блюда
 * (порт `Featured objects` из `static-html/details.html`).
 *
 * Поддерживает два источника данных OneEntry:
 * 1. Канонический `Products.getRelatedProductsById` (per-product `relatedIds`).
 * 2. Прикреплённый к продукту блок типа `similar_products_block`
 *    (например, `similar_dishes`) — резолвится через `getBlockProducts`,
 *    который умеет читать `block.similarProducts.items`.
 *
 * Используется первый непустой источник в указанном порядке.
 * @param   {object}                 props           - пропсы
 * @param   {number}                 props.productId - id текущего товара
 * @param   {string[]}               [props.blocks]  - markers блоков, прикреплённых к продукту (`product.blocks`)
 * @param   {IAttributeValues}       props.dict      - словарь
 * @returns {Promise<JSX.Element>}                   секция или пустой фрагмент
 */
const RelatedItems = async ({
  productId,
  blocks,
  dict,
}: {
  productId: number;
  blocks?: string[];
  dict: IAttributeValues;
}): Promise<JSX.Element> => {
  let items: IProductsEntity[] = [];

  const canonical = await getRelatedProductsById(productId);
  if (!canonical.isError && canonical.products?.length) {
    items = canonical.products.filter((p) => p.id !== productId);
  }

  if (!items.length && blocks?.length) {
    for (const marker of blocks) {
      if (NON_SIMILAR_BLOCK_MARKERS.has(marker)) continue;
      const block = await getBlockProducts(marker);
      if (!block.isError && block.products.length) {
        items = block.products.filter((p) => p.id !== productId);
        if (items.length) break;
      }
    }
  }

  if (!items.length) {
    return <></>;
  }

  const title = 'Featured objects';

  return (
    <section className="flex flex-col max-md:max-w-full pt-4">
      <ProductAnimations className={''} index={0}>
        <h3 className="title_name max-md:max-w-full">{title}</h3>
      </ProductAnimations>
      <CardsGridAnimations className="menu_items w-full">
        {items.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            dict={dict}
            index={i}
            pagesLimit={0}
          />
        ))}
      </CardsGridAnimations>
    </section>
  );
};

export default RelatedItems;
