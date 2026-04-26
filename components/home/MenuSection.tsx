import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductsGrid from '@/components/layout/products-grid/components/ProductsGrid';

type MenuSectionProps = {
  title: string;
  categoryMarker: string;
  products: IProductsEntity[];
  total: number;
  dict?: IAttributeValues;
  limit?: number;
  className?: string;
};

/**
 * Category section of the homepage — title + `View all` link + grid of
 * product cards. Ported 1:1 from `static-html/index.html` (`.recomended`,
 * `Brackfast`, `LUNCH`, `FIRST COURSE / SOUP`, `MAIN COURSE`, `DESERT`,
 * `BEVERAGEs` sections).
 *
 * Pure render component — products are fetched in `app/page.tsx` per
 * child page of `menu`, so the section never makes its own API call and
 * the home layout stays predictable when categories are empty (parent
 * filters them out before mapping).
 * @param   {MenuSectionProps} props - Component props.
 * @returns {JSX.Element}            Section JSX.
 */
const MenuSection = ({
  title,
  categoryMarker,
  products,
  total,
  dict = {} as IAttributeValues,
  limit = 8,
  className = 'max-w-87.5 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto pt-3.75 w-full',
}: MenuSectionProps): JSX.Element => {
  const viewAllHref = '/shop/category/' + categoryMarker;
  return (
    <section className={className}>
      <div className="title">
        <h2 className="title_name">{title}</h2>
        <Link
          className="subtitle border-b border-white pb-0.75 hover:text-[#ec722b] hover:border-[#ec722b]"
          href={viewAllHref}
        >
          View all ({total})
        </Link>
      </div>

      <ProductsGrid
        lang="en_US"
        dict={dict}
        pagesLimit={limit}
        products={products}
      />
    </section>
  );
};

export default MenuSection;
