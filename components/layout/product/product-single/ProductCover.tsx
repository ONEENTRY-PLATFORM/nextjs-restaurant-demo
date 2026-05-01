import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import FavoritesButton from '@/components/shared/FavoritesButton';
import Placeholder from '@/components/shared/Placeholder';

/**
 * Cover-only рендер картинки продукта. Использует только атрибут `cover`
 * (атрибут `more_pic` исключён по решению клиента).
 */
const ProductCover = ({
  product,
  alt,
}: {
  alt: string;
  product: IProductsEntity;
}): JSX.Element => {
  const coverRaw = product.attributeValues.cover?.value as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const cover = Array.isArray(coverRaw) ? coverRaw[0] : coverRaw;
  const src = cover?.downloadLink;

  return (
    <div className="relative w-full md:h-[120%] md:max-h-[120%]">
      {src ? (
        <Image
          width={615}
          height={615}
          sizes="(min-width: 1024px) 615px, 100vw"
          src={src}
          alt={alt}
          className="block h-auto w-full md:h-full md:w-full md:object-cover"
        />
      ) : (
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <Placeholder />
        </div>
      )}
      <div className="absolute bottom-2.5 right-2.5 z-10 flex size-12.5 items-center justify-center rounded-full bg-custom_header backdrop-blur-[10px]">
        <FavoritesButton {...product} />
      </div>
    </div>
  );
};

export default ProductCover;
