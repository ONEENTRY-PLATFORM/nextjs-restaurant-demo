import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductCard from '@/components/layout/products-grid/components/product-card/ProductCard';

type HomeBlockSectionProps = {
  title: string;
  products: IProductsEntity[];
  countElementsPerRow?: number | undefined;
  className?: string | undefined;
  dict?: IAttributeValues | undefined;
};

/**
 * Универсальный блок главной — заголовок + сетка продуктов, полностью управляется
 * через конфиг блока OneEntry. Позволяет редактору пересортировывать, ресайзить и
 * рекурировать верх главной без правки кода: позиция задаётся
 * на блоке в админке, элементы — через drag-and-drop, колонки через
 * `countElementsPerRow`, общее число через `quantity`.
 * @param   {HomeBlockSectionProps} props - Пропсы компонента.
 * @returns {JSX.Element|null}            JSX секции, либо `null`, когда нечего
 *                                        видимого рендерить.
 */
const HomeBlockSection = ({
  title,
  products,
  className,
  dict = {} as IAttributeValues,
}: HomeBlockSectionProps): JSX.Element | null => {
  const visible = products.filter((p) => p.isVisible !== false);
  if (visible.length === 0) return null;
  return (
    <section className={className}>
      <div className="title">
        <h2 className="title_name">{title}</h2>
      </div>
      <div
        className={`menu_items grid w-full grid-cols-2 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-3 max-md:[&>.menu_item]:w-full`}
      >
        {visible.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            productsLimit={visible.length}
            dict={dict}
          />
        ))}
      </div>
    </section>
  );
};

export default HomeBlockSection;
