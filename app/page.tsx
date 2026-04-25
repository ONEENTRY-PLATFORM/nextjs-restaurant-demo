import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getChildPagesByParentUrl, getProductsByPageUrl } from '@/app/api';
import HomePromo from '@/components/home/HomePromo';
import MenuSection from '@/components/home/MenuSection';

// Opt out of static prerender — the shared layout chain includes client
// components that read `useSearchParams()` (search bar, filter bottom
// sheet) which Next.js requires to be wrapped in Suspense for static
// generation. Rendering dynamically sidesteps the prerender-time bailout.
export const dynamic = 'force-dynamic';

const SECTION_LIMIT = 8;
const SECTION_BASE =
  'max-w-87.5 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto w-full';

/**
 * Home page — port of `static-html/index.html`.
 *
 * Sections are no longer hardcoded: every visible child page of the OneEntry
 * `menu` page becomes one section, sorted by `position`. Products for each
 * category are fetched sequentially (parallel `Promise.all` over the SDK
 * occasionally returned empty results for some categories — likely rate
 * limiting or shared SDK auth state being mutated mid-flight) so every
 * section gets a deterministic response. Light/dark background alternation
 * runs by index parity (even = transparent, odd = `bg-[rgba(76,77,86,0.8)]`),
 * matching the rhythm in the verstka.
 *
 * "View all" links navigate to `/shop/category/<pageUrl>` — the catalog
 * page mirrors `index_category.html` from the mockup.
 * @returns {Promise<JSX.Element>} Home page JSX.
 */
const HomePage = async (): Promise<JSX.Element> => {
  const { pages = [] } = await getChildPagesByParentUrl('menu');
  const visiblePages = pages
    .filter((p) => p.isVisible !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  type Section = {
    page: (typeof visiblePages)[number];
    products: IProductsEntity[];
    total: number;
  };
  const sections: Section[] = [];
  for (const page of visiblePages) {
    const res = await getProductsByPageUrl({
      offset: 0,
      limit: SECTION_LIMIT,
      params: { handle: page.pageUrl },
    });
    sections.push({
      page,
      products: res.isError ? [] : (res.products ?? []),
      total: res.isError ? 0 : res.total,
    });
  }

  return (
    <>
      <HomePromo />
      {sections.map(({ page, products, total }, idx) => {
        if (products.length === 0) return null;
        const title = page.localizeInfos?.title || page.pageUrl;
        const sectionClass =
          idx === 0
            ? `${SECTION_BASE} mt-7.5 md:mt-12.5 pb-1.25`
            : `${SECTION_BASE} pt-3.75 md:pt-6.25`;
        const node = (
          <MenuSection
            title={title}
            categoryMarker={page.pageUrl}
            products={products}
            total={total}
            limit={SECTION_LIMIT}
            dict={{} as IAttributeValues}
            className={sectionClass}
          />
        );
        return idx % 2 === 1 ? (
          <div key={page.id} className="bg-[rgba(76,77,86,0.8)] w-full">
            {node}
          </div>
        ) : (
          <section key={page.id}>{node}</section>
        );
      })}
    </>
  );
};

export default HomePage;
