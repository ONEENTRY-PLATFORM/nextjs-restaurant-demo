import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getChildPagesByParentUrl, getProductsByPageUrl } from '@/app/api';
import getProductBlurMap from '@/app/api/lqip/getProductBlurMap';

import CategoriesSection from './CategoriesSection';

const SECTION_LIMIT = 4;

/**
 * HomeCategoriesSection — list of category sections on the homepage (driven by `menu` child pages).
 *
 * @returns JSX of the homepage category list, or `null` when no category has products.
 */
const HomeCategoriesSection = async (): Promise<JSX.Element | null> => {
  const { pages = [] } = await getChildPagesByParentUrl('menu');
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
          <div key={page.id} className="bg-ink/80 w-full">
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
