import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import FavoritesButton from '@/components/layout/product/product-single/FavoritesButton';
import Placeholder from '@/components/shared/Placeholder';

/**
 * Cover-only рендер картинки продукта. Использует только атрибут `cover`
 * @prop {IProductsEntity} product - товар
 * @prop {string} alt - alt-атрибут картинки
 * @returns {JSX.Element} JSX-компонент для отображения картинки продукта
 */
const ProductCover = ({
  product,
  alt,
}: {
  product: IProductsEntity;
  alt: string;
}): JSX.Element => {
  const coverRaw = product.attributeValues.cover?.value as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const cover = Array.isArray(coverRaw) ? coverRaw[0] : coverRaw;
  const src = cover?.downloadLink;

  return (
    <div className="relative w-full">
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
