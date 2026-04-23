import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';

import Placeholder from '@/components/shared/Placeholder';

/**
 * Product image
 */
const ProductImage = ({
  attributes,
  alt,
}: {
  attributes: IAttributeValues;
  alt: string;
}): JSX.Element => {
  const productImage = attributes?.pic?.value as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const imageSrc = Array.isArray(productImage)
    ? productImage[0]?.downloadLink
    : productImage?.downloadLink;

  return (
    <div className="relative mb-3 size-40">
      {imageSrc ? (
        <Image
          fill
          sizes="(min-width: 300px) 66vw, 100vw"
          src={imageSrc}
          alt={alt}
          loading="lazy"
          className="size-40 shrink-0 object-cover transition-transform duration-500 group-hover:scale-125"
        />
      ) : (
        <Placeholder />
      )}
    </div>
  );
};

export default ProductImage;
