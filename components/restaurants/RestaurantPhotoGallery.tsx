'use client';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';
import { FreeMode, Mousewheel, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import RestaurantPhotoSlider from './RestaurantPhotoSlider';

type Photo = { downloadLink?: string };

/**
 * RestaurantPhotoGallery — single-restaurant gallery with a lightbox.
 *
 * Mobile: horizontal slider via {@link RestaurantPhotoSlider}; tap opens the lightbox.
 * Desktop: Swiper main slide + vertical Swiper thumbs (driven by the `Thumbs` module);
 * click on the main slide opens the lightbox.
 *
 * @param   {object}      props        - Component props.
 * @param   {Photo[]}     props.photos - List of photos with `downloadLink` URLs.
 * @param   {string}      props.alt    - Accessible alt text used for the main image and slides.
 * @returns JSX of the gallery (mobile slider + desktop main+thumbs + lightbox).
 */
const RestaurantPhotoGallery = ({ photos, alt }: { photos: Photo[]; alt: string }): JSX.Element => {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  const slides = photos
    .filter((p): p is Required<Photo> => Boolean(p?.downloadLink))
    .map(p => ({ src: p.downloadLink, alt }));

  const openLightbox = () => {
    if (slides.length > 0) setLightboxOpen(true);
  };

  return (
    <>
      {/* Mobile / tablet — horizontal slider with dots. */}
      <div className="md:hidden">
        <RestaurantPhotoSlider
          photos={photos}
          alt={alt}
          frameClassName="aspect-956/678"
          sizes="(max-width: 767px) 100vw, 700px"
          onImageClick={openLightbox}
        />
      </div>

      {/* Desktop — main slide + vertical thumbs. */}
      <div className="hidden md:grid md:aspect-1294/678 md:grid-cols-[956fr_278fr] md:gap-15">
        <div className="relative h-full w-full py-0.5! overflow-hidden rounded-panel bg-ink/40 select-none cursor-grab active:cursor-grabbing transition-opacity hover:opacity-95">
          <Swiper
            modules={[Thumbs]}
            thumbs={{
              swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
              autoScrollOffset: 1,
            }}
            slidesPerView={1}
            onSlideChange={s => setActive(s.activeIndex)}
            onClick={() => openLightbox()}
            className="h-full w-full"
          >
            {photos.map((p, i) =>
              p?.downloadLink ? (
                <SwiperSlide key={i}>
                  <Image
                    src={p.downloadLink}
                    alt={alt}
                    fill
                    sizes="(min-width: 1280px) 956px, 60vw"
                    className="object-cover pointer-events-none select-none"
                    draggable={false}
                    priority={i === 0}
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
          className="h-full w-full p-0.5! -mr-0.5! cursor-grab active:cursor-grabbing"
        >
          {photos.map((p, i) =>
            p?.downloadLink ? (
              <SwiperSlide
                key={i}
                className="h-auto! relative aspect-278/197 w-full overflow-hidden rounded-panel bg-ink/40 cursor-pointer opacity-70 transition-all hover:opacity-100 [&.swiper-slide-thumb-active]:opacity-100 [&.swiper-slide-thumb-active]:ring-2 [&.swiper-slide-thumb-active]:ring-brand"
                aria-label={`Show photo ${i + 1}`}
              >
                <Image
                  src={p.downloadLink}
                  alt={`${alt} ${i + 1}`}
                  fill
                  sizes="(min-width: 1280px) 278px, 20vw"
                  className="object-cover pointer-events-none select-none"
                  draggable={false}
                />
              </SwiperSlide>
            ) : null
          )}
        </Swiper>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={active}
        on={{ view: ({ index }) => setActive(index) }}
        slides={slides}
        plugins={[Counter, Fullscreen, Thumbnails, Zoom]}
        controller={{ closeOnBackdropClick: true }}
        styles={{
          container: {
            backgroundColor: 'rgba(76, 77, 86, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          },
        }}
      />
    </>
  );
};

export default RestaurantPhotoGallery;
