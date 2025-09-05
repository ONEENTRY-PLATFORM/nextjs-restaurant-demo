import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { FC } from 'react';

interface CarouselItemTitleProps {
  item: IProductsEntity;
}

/**
 * CarouselItem title
 *
 * @param item product object
 * @param lang current language shortcode
 * @returns title with link to product
 */
const CarouselItemTitle: FC<CarouselItemTitleProps> = ({
  item: { id, localizeInfos, attributeValues },
}) => {
  const title = localizeInfos.title;
  const colors = attributeValues?.color?.value;

  return (
    <Link href={'/shop/product/' + id} title={title}>
      {colors.map((color: { title: string }, i: number) => {
        return color.title + (i < colors.length - 1 ? ' + ' : '');
      })}
    </Link>
  );
};

export default CarouselItemTitle;
