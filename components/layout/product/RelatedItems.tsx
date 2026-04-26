import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getRelatedProductsById } from '@/app/api';

import CardsGridAnimations from '../products-grid/animations/CardsGridAnimations';
import ProductCard from '../products-grid/components/product-card/ProductCard';
import ProductAnimations from './animations/ProductAnimations';

/**
 * RelatedItems — секция «похожих товаров» внизу страницы одного блюда
 * (порт `Featured objects` из `static-html/details.html`). Источник данных —
 * канонический OneEntry SDK-метод `Products.getRelatedProductsById`,
 * настраивается в админке per-product.
 * @param   {object}                 props           - props
 * @param   {number}                 props.productId - id текущего товара
 * @param   {IAttributeValues}       props.dict      - словарь
 * @returns {Promise<JSX.Element>}                   секция или пустой фрагмент
 */
const RelatedItems = async ({
  productId,
  dict,
}: {
  productId: number;
  dict: IAttributeValues;
}): Promise<JSX.Element> => {
  const { isError, products } = await getRelatedProductsById(productId);

  if (isError || !products?.length) {
    return <></>;
  }

  const items = products.filter((p) => p.id !== productId);

  if (!items.length) {
    return <></>;
  }

  const title = 'Featured objects';

  return (
    <section className="flex flex-col max-md:max-w-full">
      <ProductAnimations className={''} index={0}>
        <h3 className="title_name max-md:max-w-full">{title}</h3>
      </ProductAnimations>
      <CardsGridAnimations className="menu_items w-full">
        {items.map((product: IProductsEntity, i: number) => (
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
