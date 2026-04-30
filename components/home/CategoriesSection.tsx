import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductsGrid from '@/components/layout/products-grid/components/ProductsGrid';

type CategoriesSectionProps = {
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
 * @param   {CategoriesSectionProps} props - Пропсы компонента.
 * @returns {JSX.Element}            JSX секции.
 */
const CategoriesSection = ({
  title,
  categoryMarker,
  products,
  total,
  dict = {} as IAttributeValues,
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

      <ProductsGrid dict={dict} products={products} productsLimit={limit} />
    </section>
  );
};

export default CategoriesSection;
