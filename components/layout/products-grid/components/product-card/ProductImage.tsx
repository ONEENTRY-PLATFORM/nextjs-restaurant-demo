'use client';

import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/types';
import { type JSX, useRef } from 'react';

import { getProductImageUrl } from '@/app/api/hooks/useAttributesData';
import { useNearViewport } from '@/app/hooks/useNearViewport';
import Placeholder from '@/components/shared/Placeholder';

/**
 * ProductImage — product image inside a grid card.
 *
 * Wraps the image in an IntersectionObserver gate: until the card is within
 * 300 px of the viewport the wrapper renders an empty placeholder so the
 * Next.js image optimizer (`/image?url=…`) is not pinged for off-screen
 * cards. Once the card scrolls into range the real `<Image>` mounts and
 * inherits its own `loading="lazy"` for the actual byte fetch. When a
 * server-generated `blurDataURL` is supplied, next/image renders it as a
 * blurred background until the real image decodes.
 *
 * @param   {object}            props               - Component props.
 * @param   {IAttributeValues}  props.attributes    - `product.attributeValues` (reads the `images` groupOfImages).
 * @param   {string}            props.alt           - Alt text for accessibility.
 * @param   {string}            [props.blurDataURL] - Base64 LQIP preview for the image (from `getProductBlurMap`).
 * @returns JSX of the product image (or `<Placeholder />` when no image is configured).
 */
const ProductImage = ({
  attributes,
  alt,
  blurDataURL,
}: {
  attributes: IAttributeValues;
  alt: string;
  blurDataURL?: string;
}): JSX.Element => {
  const imageSrc = getProductImageUrl(attributes);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(wrapperRef, { rootMargin: '300px' });

  if (!imageSrc) {
    return (
      <div className="relative aspect-square w-full overflow-hidden">
        <Placeholder className="pb-8" />
      </div>
    );
  }

  // overflow-hidden — so that scale on hover does not bleed past the card edges.
  return (
    <div ref={wrapperRef} className="relative aspect-square w-full overflow-hidden">
      {isNear ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={340}
          height={340}
          sizes="(min-width: 1240px) 278px, (min-width: 1020px) 220px, (min-width: 768px) 340px, 164px"
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          {...(blurDataURL ? { placeholder: 'blur' as const, blurDataURL } : {})}
        />
      ) : null}
    </div>
  );
};

export default ProductImage;
