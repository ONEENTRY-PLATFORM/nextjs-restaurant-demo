import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductCard from '@/components/layout/products-grid/components/product-card/ProductCard';

/**
 * Static map of supported `countElementsPerRow` values to Tailwind
 * `md:grid-cols-N` classes. Tailwind's JIT can't see classes built at
 * runtime, so the keys must be enumerated explicitly. Mobile keeps a
 * fixed 2-col grid for readability regardless of editor preference.
 */
const COLS_CLASS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

type HomeBlockSectionProps = {
  /** Section title — `block.localizeInfos.title`. */
  title: string;
  /** Pre-fetched products from the OneEntry block (already sliced to `block.quantity`). */
  products: IProductsEntity[];
  /** `block.countElementsPerRow` — number of columns at md+ breakpoints. */
  countElementsPerRow?: number | undefined;
  /** Wrapping section className override. */
  className?: string | undefined;
  /** Dictionary forwarded to `ProductCard` (unused there but kept for API parity). */
  dict?: IAttributeValues | undefined;
};

/**
 * Generic homepage block — title + product grid driven entirely by
 * OneEntry block config. Lets the editor reorder, resize and recurate
 * the top of the home page without touching code: position is set on
 * the block in admin, items via drag-and-drop, columns via
 * `countElementsPerRow`, total via `quantity`.
 * @param   {HomeBlockSectionProps} props - Component props.
 * @returns {JSX.Element|null}            Section JSX, or `null` when there's
 *                                        nothing visible to render.
 */
const HomeBlockSection = ({
  title,
  products,
  countElementsPerRow,
  className,
  dict = {} as IAttributeValues,
}: HomeBlockSectionProps): JSX.Element | null => {
  const visible = products.filter((p) => p.isVisible !== false);
  if (visible.length === 0) return null;

  const colsClass =
    COLS_CLASS[countElementsPerRow ?? 4] ?? 'md:grid-cols-4';

  return (
    <section className={className}>
      <div className="title">
        <h2 className="title_name">{title}</h2>
      </div>
      <div
        className={`grid grid-cols-2 gap-3.75 w-full pt-3 ${colsClass}`}
      >
        {visible.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            pagesLimit={visible.length}
            dict={dict}
          />
        ))}
      </div>
    </section>
  );
};

export default HomeBlockSection;
