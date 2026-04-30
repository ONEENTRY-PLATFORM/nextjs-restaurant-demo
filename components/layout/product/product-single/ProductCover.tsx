import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import FavoritesButton from '@/components/shared/FavoritesButton';
import Placeholder from '@/components/shared/Placeholder';

/**
 * Cover-only рендер картинки продукта. Использует только атрибут `cover`
 * (атрибут `more_pic` исключён по решению клиента, см. MISMATCH-LOG B.2.10).
 * Полноценная галерея с `more_pic` и слайдером сохранена в
 * `ProductImageGallery.tsx` для возможного возврата в будущем.
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
    <div className="relative w-full">
      <div className="absolute bottom-2.5 right-2.5 z-10 flex size-12.5 items-center justify-center rounded-full bg-custom_header backdrop-blur-[10px]">
        <FavoritesButton {...product} />
      </div>
      {src ? (
        <Image
          width={615}
          height={615}
          sizes="(min-width: 1024px) 615px, 100vw"
          src={src}
          alt={alt}
          className="h-auto w-full"
        />
      ) : (
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <Placeholder />
        </div>
      )}
    </div>
  );
};

export default ProductCover;
