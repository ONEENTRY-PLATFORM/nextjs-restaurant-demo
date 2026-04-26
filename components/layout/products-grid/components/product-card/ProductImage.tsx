import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';

import Placeholder from '@/components/shared/Placeholder';

/**
 * Product image — 1:1 port of the `.menu_item > img.w-full` from
 * `static-html/index.html`. Reads `attributes.cover.value` (main product image
 * from OneEntry `dish` attribute set — supports both object and array shapes;
 * legacy fallback to `pic`), falls back to {@link Placeholder} when no image
 * is configured.
 * @param   {object}          props            - Component props.
 * @param   {IAttributeValues} props.attributes - `product.attributeValues`.
 * @param   {string}          props.alt        - Accessibility alt text.
 * @returns {JSX.Element}                      Image JSX.
 */
const ProductImage = ({
  attributes,
  alt,
}: {
  attributes: IAttributeValues;
  alt: string;
}): JSX.Element => {
  const productImage = (attributes?.cover?.value ?? attributes?.pic?.value) as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const imageSrc = Array.isArray(productImage)
    ? productImage[0]?.downloadLink
    : productImage?.downloadLink;

  if (!imageSrc) {
    return (
      <div className="relative aspect-square w-full">
        <Placeholder />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={340}
      height={280}
      sizes="(min-width: 1240px) 278px, (min-width: 1020px) 220px, (min-width: 768px) 340px, 164px"
      loading="lazy"
      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
};

export default ProductImage;
