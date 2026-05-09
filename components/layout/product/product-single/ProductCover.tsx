import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import FavoritesButton from '@/components/layout/product/product-single/FavoritesButton';
import Placeholder from '@/components/shared/Placeholder';

/**
 * ProductCover — главное изображение продукта (атрибут `cover`) + FavoritesButton.
 * @param   {object}          props         - Пропсы компонента.
 * @param   {IProductsEntity} props.product - Сущность продукта OneEntry.
 * @param   {string}          props.alt     - alt-атрибут картинки.
 * @returns {JSX.Element}                   JSX обложки продукта.
 */
const ProductCover = ({ product, alt }: { product: IProductsEntity; alt: string }): JSX.Element => {
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
          sizes="(min-width: 1024px) 615px, (min-width: 768px) 700px, 100vw"
          src={src}
          alt={alt}
          className="block h-auto max-h-75 w-full object-cover md:max-h-none lg:h-115"
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
