import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type JSX } from 'react';

import ProductCard from './product-card/ProductCard';

/**
 * Products grid
 */
const ProductsGrid = ({ dict, products, pagesLimit }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lang: any;
  dict: IAttributeValues;
  pagesLimit: number;
  products: IProductsEntity[];
}): JSX.Element => {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 max-md:w-full">
      {products
        ?.filter((item) => item.isVisible)
        .map((product: IProductsEntity, index: number) => {
          return (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              pagesLimit={pagesLimit}
              dict={dict}
            />
          );
        })}
    </div>
  );
};

export default ProductsGrid;
