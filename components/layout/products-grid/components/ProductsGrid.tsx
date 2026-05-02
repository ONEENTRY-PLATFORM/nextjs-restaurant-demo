import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type JSX } from 'react';

import ProductCard from './product-card/ProductCard';

/**
 * Сетка продуктов
 */
const ProductsGrid = ({
  dict,
  products,
  productsLimit,
}: {
  dict: IAttributeValues;
  productsLimit: number;
  products: IProductsEntity[];
}): JSX.Element => {
  // OneEntry может вернуть один и тот же товар несколько раз, когда поиск
  // совмещён с несколькими фильтрами (например, `preferences` + `search`):
  // продукт всплывает по разным условиям и SDK не дедупает результат.
  // Дедупаем по `id`, иначе React падает с "two children with the same key".
  const seen = new Set<number>();
  const uniqueVisible = (products ?? []).filter((item) => {
    if (!item.isVisible) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return (
    <div className="menu_items grid w-full grid-cols-2 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-3 max-md:[&>.menu_item]:w-full">
      {uniqueVisible.map((product: IProductsEntity, index: number) => {
        return (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            productsLimit={productsLimit}
            dict={dict}
          />
        );
      })}
    </div>
  );
};

export default ProductsGrid;
