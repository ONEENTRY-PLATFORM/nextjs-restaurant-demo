import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getChildPagesByParentUrl, getProductsByPageUrl } from '@/app/api';

import MenuSection from './MenuSection';

const SECTION_LIMIT = 8;
const SECTION_BASE =
  'max-w-87.5 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto w-full';

/**
 * Асинхронная секция, которая материализует список категорий на главной —
 * один {@link MenuSection} на каждую видимую дочернюю страницу `menu`, отсортированы по
 * `page.position`, до {@link SECTION_LIMIT} продуктов в каждой.
 *
 * Живёт за блоком `home_categories`, чтобы редактор контролировал,
 * *где* в ритме страницы окажется весь блок категорий (через
 * пересортировку блоков в админке OneEntry), не теряя при этом ритм чередования
 * фона по дочерним внутри.
 *
 * Запросы продуктов выполняются последовательно, потому что параллельный fan-out поверх
 * общего auth-состояния OneEntry SDK выдавал пустые ответы на некоторых
 * категориях в прошлых тестах.
 * @returns {Promise<JSX.Element|null>} JSX списка категорий, либо `null`, если
 *                                      ни в одной категории нет продуктов.
 */
const HomeCategoriesSection = async (): Promise<JSX.Element | null> => {
  const { pages = [] } = await getChildPagesByParentUrl('menu');
  const visiblePages = pages
    .filter((p) => p.isVisible !== false)
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

  const populated = sections.filter((s) => s.products.length > 0);
  if (populated.length === 0) return null;

  return (
    <>
      {populated.map(({ page, products, total }, idx) => {
        const title = page.localizeInfos?.title || page.pageUrl;
        const sectionClass = `${SECTION_BASE} pt-3.75 md:pt-6.25`;
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
        return idx % 2 === 0 ? (
          <div key={page.id} className="bg-[rgba(76,77,86,0.8)] w-full">
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
