import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductsGrid from '@/components/layout/products-grid/components/ProductsGrid';

type MenuSectionProps = {
  /** Section title — usually `page.localizeInfos.title`. */
  title: string;
  /** Category page URL — used for the "View all" link target. */
  categoryMarker: string;
  /** Pre-fetched products for the category (server-side, in `app/page.tsx`). */
  products: IProductsEntity[];
  /** Total number of products in the category (for the "View all (N)" badge). */
  total: number;
  /** Dictionary of localized strings forwarded to ProductsGrid → ProductCard. */
  dict?: IAttributeValues;
  /** Visible items limit on the home page (matches the product fetch limit). */
  limit?: number;
  /** Wrapping section className override. */
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
