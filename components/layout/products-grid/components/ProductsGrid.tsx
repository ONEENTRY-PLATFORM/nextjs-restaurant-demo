import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type JSX } from 'react';

import ProductCard from './product-card/ProductCard';

/** ProductsGrid — product cards grid. */
const ProductsGrid = ({
  products,
  productsLimit,
}: {
  productsLimit: number;
  products: IProductsEntity[];
}): JSX.Element => {
  // Deduplicate by `id`: OneEntry returns duplicates when combining filters (preferences+search),
  // otherwise React throws "two children with the same key".
  const seen = new Set<number>();
  const uniqueVisible = (products ?? []).filter(item => {
    if (!item.isVisible) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return (
    <div className="menu_items grid w-full grid-cols-2 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-2 max-md:[&>.menu_item]:w-full">
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
