import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import CardsGridAnimations from '@/components/layout/products-grid/animations/CardsGridAnimations';
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
 * CategoriesSection — homepage category section with title, "View all" link and product grid.
 *
 * @param   {CategoriesSectionProps} props                - Component props.
 * @param   {string}                 props.title          - Section heading.
 * @param   {string}                 props.categoryMarker - Category page handle used for the "View all" link.
 * @param   {IProductsEntity[]}      props.products       - Products to render in the section grid.
 * @param   {number}                 props.total          - Total number of products in the category (rendered next to "View all").
 * @param   {number}                 [props.limit]        - Page-size hint passed to the inner products grid (defaults to 8).
 * @param   {string}                 [props.className]    - Optional class merged onto the wrapping `<section>` (currently unused).
 * @returns {JSX.Element} JSX of the homepage category section.
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

      <CardsGridAnimations className="w-full">
        <ProductsGrid products={products} productsLimit={limit} />
      </CardsGridAnimations>
    </section>
  );
};

export default CategoriesSection;
