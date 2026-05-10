import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type JSX } from 'react';

import ProductCard from './product-card/ProductCard';

/**
 * ProductsGrid — product cards grid (deduplicates by id and skips invisible items).
 *
 * @param   {object}            props               - Component props.
 * @param   {IProductsEntity[]} props.products      - Source product list from the SDK.
 * @param   {number}            props.productsLimit - Page size, forwarded to `<ProductCard>` for stagger calculations.
 * @returns {JSX.Element} JSX of the responsive product card grid.
 */
const ProductsGrid = ({
  products,
  productsLimit,
}: {
  productsLimit: number;
  products: IProductsEntity[];
}): JSX.Element => {
  // Deduplicate by `id`
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
