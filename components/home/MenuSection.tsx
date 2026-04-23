import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getProducts, getProductsByPageUrl } from '@/app/api';
import ProductsGrid from '@/components/layout/products-grid/components/ProductsGrid';

import type { MenuItemData } from './MenuItemCard';
import MenuItemCard from './MenuItemCard';

type MenuSectionProps = {
  title: string;
  /** Optional category pageUrl marker — when set, section fetches real data
   *  from OneEntry via `getProductsByPageUrl`. If the call returns no items
   *  (API closed or no data), falls back to the mock `items` below. */
  categoryMarker?: string;
  /** Mock items used when there's no `categoryMarker` or the API returned
   *  nothing. Each item is passed to {@link MenuItemCard}. */
  items?: MenuItemData[];
  /** Visible count on desktop. Displayed next to "View all" text. */
  viewAllCount?: number;
  /** Dictionary for CMS-driven strings inside ProductCard / ProductsGrid. */
  dict?: IAttributeValues;
  /** Language code for fetching. */
  langCode?: string;
  /** Max products to fetch from API. */
  limit?: number;
  /** Optional wrapping section className override. */
  className?: string;
  /** Optional extra wrapper (e.g. `bg-[rgba(76,77,86,0.8)]`). */
  wrapperClassName?: string;
  /** Extra padding-top for the first menu_items grid (per static-html). */
  gridClassName?: string;
};

/**
 * Category section of the homepage — title + `View all` link + grid of
 * product cards. Ported 1:1 from `static-html/index.html` (`.recomended`,
 * `Brackfast`, `LUNCH`, `FIRST COURSE / SOUP`, `MAIN COURSE`, `DESERT`,
 * `BEVERAGEs` sections).
 *
 * Rendering strategy:
 *   1. If `categoryMarker` is provided, tries `getProductsByPageUrl` first,
 *      falling back to `getProducts` (whole catalog) if the page-specific
 *      call returns nothing. On success, delegates to {@link ProductsGrid}
 *      (the same grid the `/shop` page uses — `ProductCard`).
 *   2. If real data is unavailable (API closed, no items) and `items` mock
 *      data is passed, renders mock cards via {@link MenuItemCard} so the
 *      homepage is never blank in dev.
 * @param   {MenuSectionProps}     props - Component props.
 * @returns {Promise<JSX.Element>}       Section JSX.
 */
const MenuSection = async ({
  title,
  categoryMarker,
  items = [],
  viewAllCount,
  dict = {} as IAttributeValues,
  limit = 8,
  className = 'max-w-[350px] md:max-w-[700px] lg:max-w-[1000px] xl:max-w-[1292px] mx-auto pt-[15px] w-full',
  wrapperClassName,
  gridClassName = 'menu_items pt-[12px]',
}: MenuSectionProps): Promise<JSX.Element> => {
  let products: IProductsEntity[] = [];
  if (categoryMarker) {
    const byCat = await getProductsByPageUrl({
      offset: 0,
      limit,
      params: { handle: categoryMarker },
    });
    if (!byCat.isError && byCat.products && byCat.products.length > 0) {
      products = byCat.products;
    } else {
      const all = await getProducts({ offset: 0, limit });
      if (!all.isError && all.products && all.products.length > 0) {
        products = all.products.slice(0, limit);
      }
    }
  }

  const hasRealProducts = products.length > 0;
  const mockTop = items.slice(0, 4);
  const mockBottom = items.slice(4);
  const count =
    viewAllCount ?? (hasRealProducts ? products.length : items.length);

  const content = (
    <section className={className}>
      <div className="title">
        <h2 className="title_name">{title}</h2>
        <a
          className="subtitle border-b border-white pb-[3px] hover:text-[#ec722b] hover:border-[#ec722b]"
          href="#"
        >
          View all ({count})
        </a>
      </div>

      {hasRealProducts ? (
        <ProductsGrid
          lang="en_US"
          dict={dict}
          pagesLimit={limit}
          products={products}
        />
      ) : (
        <>
          <div className={gridClassName}>
            {mockTop.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
          {mockBottom.length > 0 ? (
            <div className="menu_items md:hidden pt-0">
              {mockBottom.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{content}</div>;
  }
  return content;
};

export default MenuSection;
