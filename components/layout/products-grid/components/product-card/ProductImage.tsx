import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';

import Placeholder from '@/components/shared/Placeholder';

/**
 * ProductImage — product image inside a grid card.
 *
 * @param   {object}            props            - Component props.
 * @param   {IAttributeValues}  props.attributes - `product.attributeValues` (reads `cover.value`, supports object and array).
 * @param   {string}            props.alt        - Alt text for accessibility.
 * @returns {JSX.Element} JSX of the cover image (or `<Placeholder />` when no image is configured).
 */
const ProductImage = ({
  attributes,
  alt,
}: {
  attributes: IAttributeValues;
  alt: string;
}): JSX.Element => {
  const productImage = attributes?.cover?.value as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const imageSrc = Array.isArray(productImage)
    ? productImage[0]?.downloadLink
    : productImage?.downloadLink;

  if (!imageSrc) {
    return (
      <div className="relative aspect-square w-full overflow-hidden">
        <Placeholder className="pb-8" />
      </div>
    );
  }

  // overflow-hidden — so that scale on hover does not bleed past the card edges.
  return (
    <div className="relative aspect-square w-full overflow-hidden">
      <Image
        src={imageSrc}
        alt={alt}
        width={340}
        height={340}
        sizes="(min-width: 1240px) 278px, (min-width: 1020px) 220px, (min-width: 768px) 340px, 164px"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
};

export default ProductImage;
