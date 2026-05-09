import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type JSX } from 'react';

import ProductCard from './product-card/ProductCard';

/** ProductsGrid — сетка карточек продуктов. */
const ProductsGrid = ({
  products,
  productsLimit,
}: {
  productsLimit: number;
  products: IProductsEntity[];
}): JSX.Element => {
  // Дедуп по `id`: OneEntry возвращает дубли при совмещении фильтров (preferences+search),
  // иначе React падает с "two children with the same key".
  const seen = new Set<number>();
  const uniqueVisible = (products ?? []).filter(item => {
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
          />
        );
      })}
    </div>
  );
};

export default ProductsGrid;
