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
 * HomeBlockSection — title + product grid, configured via a OneEntry block.
 *
 * @param   {HomeBlockSectionProps} props                       - Component props.
 * @param   {string}                props.title                 - Section heading.
 * @param   {IProductsEntity[]}     props.products              - Products to render in the grid.
 * @param   {number}                [props.countElementsPerRow] - Layout hint from the CMS (currently unused but accepted for parity).
 * @param   {string}                [props.className]           - Override for the section className.
 * @returns {JSX.Element | null} JSX of the section, or `null` when there is nothing visible to render.
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
        className={`menu_items grid w-full grid-cols-2 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-2 max-md:[&>.menu_item]:w-full`}
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
