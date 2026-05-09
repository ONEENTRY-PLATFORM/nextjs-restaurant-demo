import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import CardsGridAnimations from '@/components/layout/products-grid/animations/CardsGridAnimations';
import ProductCard from '@/components/layout/products-grid/components/product-card/ProductCard';

type HomeBlockSectionProps = {
  title: string;
  products: IProductsEntity[];
  countElementsPerRow?: number | undefined;
  className?: string | undefined;
};

/**
 * HomeBlockSection — заголовок + сетка продуктов, конфигурируется через блок OneEntry.
 * @param   {HomeBlockSectionProps} props - Пропсы.
 * @returns {JSX.Element|null}            JSX секции либо `null`, если нечего рендерить.
 */
const HomeBlockSection = ({
  title,
  products,
  className,
}: HomeBlockSectionProps): JSX.Element | null => {
  const visible = products.filter(p => p.isVisible !== false);
  if (visible.length === 0) return null;
  return (
    <section className={className}>
      <div className="title">
        <h2 className="title_name">{title}</h2>
      </div>
      <CardsGridAnimations
        className={`menu_items grid w-full grid-cols-2 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-3 max-md:[&>.menu_item]:w-full`}
      >
        {visible.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            productsLimit={visible.length}
          />
        ))}
      </CardsGridAnimations>
    </section>
  );
};

export default HomeBlockSection;
