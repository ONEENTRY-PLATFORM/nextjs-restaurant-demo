'use client';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';
import { FreeMode, Mousewheel, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';

import RestaurantPhotoSlider from './RestaurantPhotoSlider';

// `yet-another-react-lightbox` (lib + 4 plugins + 3 CSS) is only used after the
// user opens the lightbox. Splitting it into its own chunk via `dynamic` keeps
// it out of the first paint of the restaurant page.
const RestaurantLightbox = dynamic(() => import('./RestaurantLightbox'), { ssr: false });

type Photo = { downloadLink?: string };

/**
 * RestaurantPhotoGallery — single-restaurant gallery with a lightbox.
 *
 * Mobile: horizontal slider via {@link RestaurantPhotoSlider}; tap opens the lightbox.
 * Desktop: Swiper main slide + vertical Swiper thumbs (driven by the `Thumbs` module);
 * click on the main slide opens the lightbox.
 *
 * @param   {object}                  props          - Component props.
 * @param   {Photo[]}                 props.photos   - List of photos with `downloadLink` URLs.
 * @param   {string}                  props.alt      - Accessible alt text used for the main image and slides.
 * @param   {Record<string, string>}  [props.blurMap] - `{ [downloadLink]: base64DataURI }` LQIP placeholders (see `getPhotosBlurMap`).
 * @returns JSX of the gallery (mobile slider + desktop main+thumbs + lightbox).
 */
const RestaurantPhotoGallery = ({
  photos,
  alt,
  blurMap,
}: {
  photos: Photo[];
  alt: string;
  blurMap?: Record<string, string>;
}): JSX.Element => {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Defer mounting `RestaurantLightbox` (and thus loading its chunk) until the
  // user has interacted with the gallery at least once. After the first open
  // the component stays mounted so subsequent opens are instant.
  const [lightboxMounted, setLightboxMounted] = useState(false);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  const slides = photos
    .filter((p): p is Required<Photo> => Boolean(p?.downloadLink))
    .map(p => ({ src: p.downloadLink, alt }));

  const openLightbox = () => {
    if (slides.length === 0) return;
    setLightboxMounted(true);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Mobile / tablet — horizontal slider with dots. */}
      <div className="md:hidden">
        <RestaurantPhotoSlider
          photos={photos}
          alt={alt}
          blurMap={blurMap}
          frameClassName="aspect-956/678"
          sizes="(max-width: 767px) 100vw, 700px"
          onImageClick={openLightbox}
        />
      </div>

      {/* Desktop — main slide + vertical thumbs. */}
      <div className="hidden md:grid md:aspect-1294/678 md:grid-cols-[956fr_278fr] md:gap-15">
        <div className="relative size-full cursor-grab overflow-hidden rounded-panel bg-ink/40 py-0.5! transition-opacity select-none hover:opacity-95 active:cursor-grabbing">
          <Swiper
            modules={[Thumbs]}
            thumbs={{
              swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
              autoScrollOffset: 1,
            }}
            slidesPerView={1}
            onSlideChange={s => setActive(s.activeIndex)}
            onClick={() => openLightbox()}
            className="size-full"
          >
            {photos.map((p, i) =>
              p?.downloadLink ? (
                <SwiperSlide key={i}>
                  <Image
                    src={p.downloadLink}
                    alt={alt}
                    fill
                    sizes="(min-width: 1280px) 956px, 60vw"
                    className="pointer-events-none object-cover select-none"
                    draggable={false}
                    priority={i === 0}
                    {...(blurMap?.[p.downloadLink]
                      ? { placeholder: 'blur' as const, blurDataURL: blurMap[p.downloadLink] }
                      : {})}
                  />
                </SwiperSlide>
              ) : null
            )}
          </Swiper>
        </div>

        <Swiper
          modules={[FreeMode, Mousewheel, Thumbs]}
          onSwiper={setThumbsSwiper}
          direction="vertical"
          slidesPerView="auto"
          spaceBetween={44}
          freeMode
          mousewheel
          watchSlidesProgress
          className="-mr-0.5! size-full cursor-grab p-0.5! active:cursor-grabbing"
        >
          {photos.map((p, i) =>
            p?.downloadLink ? (
              <SwiperSlide
                key={i}
                className="relative aspect-278/197 h-auto! w-full cursor-pointer overflow-hidden rounded-panel bg-ink/40 opacity-70 transition-all hover:opacity-100 [&.swiper-slide-thumb-active]:opacity-100 [&.swiper-slide-thumb-active]:ring-2 [&.swiper-slide-thumb-active]:ring-brand"
                aria-label={`Show photo ${i + 1}`}
              >
                <Image
                  src={p.downloadLink}
                  alt={`${alt} ${i + 1}`}
                  fill
                  sizes="(min-width: 1280px) 278px, 20vw"
                  className="pointer-events-none object-cover select-none"
                  draggable={false}
                  {...(blurMap?.[p.downloadLink]
                    ? { placeholder: 'blur' as const, blurDataURL: blurMap[p.downloadLink] }
                    : {})}
                />
              </SwiperSlide>
            ) : null
          )}
        </Swiper>
      </div>

      {lightboxMounted && (
        <RestaurantLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          index={active}
          onView={setActive}
          slides={slides}
        />
      )}
    </>
  );
};

export default RestaurantPhotoGallery;
