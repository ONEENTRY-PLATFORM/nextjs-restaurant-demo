import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getChildPagesByParentUrl, getProductsByPageUrl } from '@/app/api';

import CategoriesSection from './CategoriesSection';

const SECTION_LIMIT = 4;

/**
 * HomeCategoriesSection — list of category sections on the homepage (driven by `menu` child pages).
 * Product requests run sequentially: parallel fan-out over the shared SDK auth state sometimes returned empty responses.
 * @returns {Promise<JSX.Element|null>} List JSX or `null` when no category has products.
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
  };
  const sections: CategoryEntry[] = [];
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

  const populated = sections.filter(s => s.products.length > 0);
  if (populated.length === 0) return null;

  return (
    <>
      {populated.map(({ page, products, total }, idx) => {
        const node = (
          <CategoriesSection
            title={page.localizeInfos?.title || page.pageUrl}
            categoryMarker={page.pageUrl}
            products={products}
            total={total}
            limit={SECTION_LIMIT}
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
