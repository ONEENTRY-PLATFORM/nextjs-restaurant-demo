import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import getProductBlurMap from '@/app/api/lqip/getProductBlurMap';
import { getChildPagesByParentUrl } from '@/app/api/server/pages/getChildPagesByParentUrl';
import { getProductsByPageUrl } from '@/app/api/server/products/getProductsByPageUrl';
import { PAGES } from '@/app/utils/constants';

import CategoriesSection from './CategoriesSection';

const SECTION_LIMIT = 4;

/**
 * HomeCategoriesSection — list of category sections on the homepage (driven by `menu` child pages).
 *
 * @returns JSX of the homepage category list, or `null` when no category has products.
 */
const HomeCategoriesSection = async (): Promise<JSX.Element | null> => {
  const { pages = [] } = await getChildPagesByParentUrl(PAGES.menu);
  const visiblePages = pages
    .filter(p => p.isVisible !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  type CategoryEntry = {
    page: (typeof visiblePages)[number];
    products: IProductsEntity[];
    total: number;
    blurMap: Record<number, string>;
  };
  const sections: CategoryEntry[] = await Promise.all(
    visiblePages.map(async page => {
      const res = await getProductsByPageUrl({
        offset: 0,
        limit: SECTION_LIMIT,
        params: { handle: page.pageUrl },
      });
      const products = res.isError ? [] : (res.products ?? []);
      const blurMap = await getProductBlurMap(products);
      return {
        page,
        products,
        total: res.isError ? 0 : res.total,
        blurMap,
      };
    })
  );

  const populated = sections.filter(s => s.products.length > 0);
  if (populated.length === 0) return null;

  return (
    <>
      {populated.map(({ page, products, total, blurMap }, idx) => {
        const node = (
          <CategoriesSection
            title={page.localizeInfos?.title || page.pageUrl}
            categoryMarker={page.pageUrl}
            products={products}
            total={total}
            limit={SECTION_LIMIT}
            blurMap={blurMap}
          />
        );
        return idx % 2 === 0 ? (
          <div key={page.id} className="w-full bg-ink/80">
            {node}
          </div>
        ) : (
          <div key={page.id}>{node}</div>
        );
      })}
    </>
  );
};

export default HomeCategoriesSection;
