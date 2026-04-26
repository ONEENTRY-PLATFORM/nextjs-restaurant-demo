'use client';

// import '@/app/styles/image-gallery.css';
// import '@/app/styles/slick.css';
// import '@/app/styles/slick-theme.css';

import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, Key } from 'react';
import { useState } from 'react';
import Slider from 'react-slick';

import FavoritesButton from '@/components/shared/FavoritesButton';
import Placeholder from '@/components/shared/Placeholder';

/**
 * Product images gallery/placeholder
 */
const ProductImageGallery = ({
  product,
  alt,
}: {
  alt: string;
  product: IProductsEntity;
}): JSX.Element => {
  const [nav1, setNav1] = useState<Slider | null>(null);
  const [nav2, setNav2] = useState<Slider | null>(null);
  // extract attributeValues from product
  const { attributeValues } = product;

  // extract images from attributeValues (admin `dish` set uses `cover`; `pic` legacy)
  const coverRaw = (attributeValues.cover?.value ??
    attributeValues.pic?.value) as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const imageSrc = Array.isArray(coverRaw) ? coverRaw[0] : coverRaw;
  const morePic =
    (attributeValues.more_pic?.value as
      | Array<{ downloadLink?: string }>
      | undefined) ?? [];
  const imagesData = [imageSrc, ...morePic]
    .filter((img) => Boolean(img?.downloadLink))
    .map((img) => ({
      original: img?.downloadLink,
      thumbnail: img?.downloadLink,
    }));
  const isGallery = imagesData.length > 1;
  const hasImages = imagesData.length > 0;

  return (
    <div className="relative w-full">
      <div className="absolute bottom-2.5 right-2.5 z-10 flex size-12.5 items-center justify-center rounded-full bg-custom_header backdrop-blur-[10px]">
        <FavoritesButton {...product} />
      </div>
      {hasImages ? (
        isGallery ? (
          <div className="relative w-full">
            <div className="relative aspect-4/3 w-full overflow-hidden">
              <Slider asNavFor={nav2 ?? undefined} ref={setNav1}>
                {imagesData.map((image, i: Key) => {
                  return (
                    <div key={i} className="w-full items-center">
                      <Image
                        width={615}
                        height={615}
                        sizes="(min-width: 1024px) 615px, 100vw"
                        src={image.original ?? ''}
                        alt={''}
                        className="aspect-square size-full object-cover"
                      />
                    </div>
                  );
                })}
              </Slider>
            </div>
            <Slider
              asNavFor={nav1 ?? undefined}
              ref={setNav2}
              slidesToShow={3}
              swipeToSlide={true}
              focusOnSelect={true}
              arrows={false}
            >
              {imagesData.map((image, i: Key) => {
                return (
                  <div key={i} className="w-full items-center">
                    <Image
                      width={80}
                      height={80}
                      src={image.thumbnail ?? ''}
                      alt={''}
                      className="mx-auto self-center"
                    />
                  </div>
                );
              })}
            </Slider>
          </div>
        ) : (
          <div className="relative aspect-4/3 w-full overflow-hidden">
            <Image
              width={615}
              height={615}
              sizes="(min-width: 1024px) 615px, 100vw"
              src={imagesData[0]?.original ?? ''}
              alt={alt}
              className="size-full object-cover"
            />
          </div>
        )
      ) : (
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <Placeholder />
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
