import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

/**
 * CarouselItem title component
 */
const CarouselItemTitle = ({
  item: { id, localizeInfos, attributeValues },
}: {
  item: IProductsEntity;
}): JSX.Element => {
  const title = localizeInfos.title ?? '';
  const colors =
    (attributeValues?.color?.value as Array<{ title: string }> | undefined) ??
    [];

  return (
    <Link href={'/shop/product/' + id} title={title}>
      {colors.map((color: { title: string }, i: number) => {
        return color.title + (i < colors.length - 1 ? ' + ' : '');
      })}
    </Link>
  );
};

export default CarouselItemTitle;
