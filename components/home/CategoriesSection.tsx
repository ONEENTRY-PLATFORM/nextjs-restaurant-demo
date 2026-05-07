import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductsGrid from '@/components/layout/products-grid/components/ProductsGrid';

type CategoriesSectionProps = {
  title: string;
  categoryMarker: string;
  products: IProductsEntity[];
  total: number;
  limit?: number;
  className?: string;
};

/**
 * Секция категории главной
 * @param   {CategoriesSectionProps} props - Пропсы компонента.
 * @returns {JSX.Element}            JSX секции.
 */
const CategoriesSection = ({
  title,
  categoryMarker,
  products,
  total,
  limit = 8,
}: CategoriesSectionProps): JSX.Element => {
  const viewAllHref = '/shop/category/' + categoryMarker;
  return (
    <section className="section_layout">
      <div className="title">
        <h2 className="title_name">{title}</h2>
        <Link
          className="subtitle border-b border-white pb-0.75 hover:text-brand hover:border-brand"
          href={viewAllHref}
        >
          View all ({total})
        </Link>
      </div>

      <ProductsGrid products={products} productsLimit={limit} />
    </section>
  );
};

export default CategoriesSection;
