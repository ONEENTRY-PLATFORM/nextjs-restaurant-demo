import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import Placeholder from '@/components/shared/Placeholder';

/**
 * CarouselItem image component
 */
const CarouselItemImage = ({
  item,
}: {
  item: IProductsEntity;
}): JSX.Element => {
  const title = item.localizeInfos.title ?? '';
  const picVal = (item.attributeValues.cover?.value ??
    item.attributeValues.pic?.value) as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const imageSrc = Array.isArray(picVal)
    ? picVal[0]?.downloadLink
    : picVal?.downloadLink;

  return (
    <Link href={'/shop/product/' + item.id} title={title}>
      {imageSrc ? (
        <Image
          width={80}
          height={80}
          src={imageSrc}
          alt={title}
          className="aspect-auto size-full h-auto min-w-full shrink-0 rounded-lg object-cover"
        />
      ) : (
        <Placeholder />
      )}
    </Link>
  );
};

export default CarouselItemImage;
