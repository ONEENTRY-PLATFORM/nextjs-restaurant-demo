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
 * Секция категории главной — заголовок + ссылка `View all` + сетка
 * карточек продуктов. Перенесена 1:1 из `static-html/index.html` (секции `.recomended`,
 * `Brackfast`, `LUNCH`, `FIRST COURSE / SOUP`, `MAIN COURSE`, `DESERT`,
 * `BEVERAGEs`).
 *
 * Чисто рендерный компонент — продукты фетчатся в `app/page.tsx` по
 * каждой дочерней странице `menu`, поэтому секция никогда не делает свой API-запрос и
 * layout главной остаётся предсказуемым при пустых категориях (родитель
 * отфильтровывает их до маппинга).
 * @param   {MenuSectionProps} props - Пропсы компонента.
 * @returns {JSX.Element}            JSX секции.
 */
const MenuSection = ({
  title,
  categoryMarker,
  products,
  total,
  dict = {} as IAttributeValues,
  limit = 8,
  className = 'max-w-100 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto pt-3.75 w-full',
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
