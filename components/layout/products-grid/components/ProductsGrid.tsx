import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type JSX } from 'react';

import ProductCard from './product-card/ProductCard';

/**
 * ProductsGrid — product cards grid (deduplicates by id and skips invisible items).
 *
 * @param   {object}                  props               - Component props.
 * @param   {IProductsEntity[]}       props.products      - Source product list from the SDK.
 * @param   {number}                  props.productsLimit - Page size, forwarded to `<ProductCard>` for stagger calculations.
 * @param   {Record<number, string>}  [props.blurMap]     - Optional `{ productId: base64DataURI }` for LQIP placeholders (see `getProductBlurMap`).
 * @returns JSX of the responsive product card grid.
 */
const ProductsGrid = ({
  products,
  productsLimit,
  blurMap,
}: {
  productsLimit: number;
  products: IProductsEntity[];
  blurMap?: Record<number, string>;
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
    <div className="menu_items">
      {uniqueVisible.map((product: IProductsEntity, index: number) => {
        const blur = blurMap?.[product.id];
        return (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            productsLimit={productsLimit}
            {...(blur ? { blurDataURL: blur } : {})}
          />
        );
      })}
    </div>
  );
};

export default ProductsGrid;
