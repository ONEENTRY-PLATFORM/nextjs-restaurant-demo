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
  return (
    <div className="menu_items grid w-full grid-cols-2 max-md:[&>.menu_item]:w-full md:grid-cols-4">
      {products
        ?.filter((item) => item.isVisible)
        .map((product: IProductsEntity, index: number) => {
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
