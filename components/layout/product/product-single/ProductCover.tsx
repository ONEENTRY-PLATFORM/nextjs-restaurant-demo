import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { getProductBlurDataURL, getProductImageUrl } from '@/app/api';
import getLqipPreview from '@/app/api/lqip/getLqipPreview';
import FavoritesButton from '@/components/layout/product/product-single/FavoritesButton';
import Placeholder from '@/components/shared/Placeholder';

/**
 * ProductCover — main product image (`images` groupOfImages) with a favourites button overlay.
 *
 * Prefers OneEntry's inline LQIP (`getProductBlurDataURL`) as the blur placeholder; for images uploaded
 * before preview generation it falls back to generating one from the full asset via `getLqipPreview`.
 *
 * @param   {object}            props         - Component props.
 * @param   {IProductsEntity}   props.product - OneEntry product entity.
 * @param   {string}            props.alt     - Image alt attribute.
 * @returns Promise resolving to JSX of the product cover image.
 */
const ProductCover = async ({
  product,
  alt,
}: {
  product: IProductsEntity;
  alt: string;
}): Promise<JSX.Element> => {
  const src = getProductImageUrl(product.attributeValues);
  const blurDataURL =
    getProductBlurDataURL(product.attributeValues) || (src ? await getLqipPreview(src) : '');

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
          {...(blurDataURL ? { placeholder: 'blur' as const, blurDataURL } : {})}
        />
      ) : (
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <Placeholder />
        </div>
      )}
      <div className="absolute right-2.5 bottom-2.5 z-10 flex size-12.5 items-center justify-center rounded-full bg-custom_header backdrop-blur-card">
        <FavoritesButton {...product} />
      </div>
    </div>
  );
};

export default ProductCover;
