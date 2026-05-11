'use client';

import 'swiper/css';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';

type Photo = { downloadLink?: string };

/**
 * RestaurantPhotoSlider — restaurant photo slider with dot indicators, swipe, and autoplay.
 *
 * Swipe/drag/click discrimination is handled by Swiper internally. Pass `autoplayMs={null}`
 * to disable autoplay. When `onImageClick` is provided, a tap on the slide invokes it.
 *
 * @param   {object}        props                  - Component props.
 * @param   {Photo[]}       props.photos           - List of photos with `downloadLink` URLs.
 * @param   {string}        props.alt              - Accessible alt text used for the active slide.
 * @param   {string}        [props.frameClassName] - Aspect-ratio class applied to the slider frame.
 * @param   {string}        [props.sizes]          - `<Image sizes>` directive for the slides.
 * @param   {boolean}       [props.priority]       - When `true`, the first slide is loaded with `priority`.
 * @param   {() => void}    [props.onImageClick]   - Invoked when the user taps a slide (Swiper suppresses this after a swipe).
 * @param   {number | null} [props.autoplayMs]     - Autoplay interval in ms (`null` disables autoplay).
 * @returns JSX of the slider with optional dot tablist.
 */
const RestaurantPhotoSlider = ({
  photos,
  alt,
  frameClassName = 'aspect-[16/9] md:aspect-[2.4/1]',
  sizes = '(min-width: 1280px) 1292px, (min-width: 1024px) 1000px, (min-width: 768px) 700px, 100vw',
  priority = true,
  onImageClick,
  autoplayMs = 5000,
}: {
  photos: Photo[];
  alt: string;
  frameClassName?: string;
  sizes?: string;
  priority?: boolean;
  onImageClick?: () => void;
  autoplayMs?: number | null;
}): JSX.Element => {
  const [active, setActive] = useState(0);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const total = photos.length;

  const grabClass = total > 1 ? ' cursor-grab active:cursor-grabbing' : '';
  const clickableClass = onImageClick ? ' transition-opacity hover:opacity-95' : '';

  return (
    <div>
      <div
        className={
          'relative w-full overflow-hidden rounded-panel bg-ink/40 select-none ' +
          frameClassName +
          grabClass +
          clickableClass
        }
      >
        <Swiper
          modules={autoplayMs && total > 1 ? [Autoplay] : []}
          slidesPerView={1}
          loop={total > 1}
          autoplay={
            autoplayMs && total > 1
              ? { delay: autoplayMs, disableOnInteraction: false, pauseOnMouseEnter: true }
              : false
          }
          onSwiper={setSwiper}
          onSlideChange={s => setActive(s.realIndex)}
          {...(onImageClick ? { onClick: () => onImageClick() } : {})}
          className="h-full w-full"
        >
          {photos.map((p, i) =>
            p?.downloadLink ? (
              <SwiperSlide key={i}>
                <Image
                  src={p.downloadLink}
                  alt={i === active ? alt : ''}
                  fill
                  sizes={sizes}
                  className="object-cover pointer-events-none select-none"
                  draggable={false}
                  priority={priority && i === 0}
                />
              </SwiperSlide>
            ) : null
          )}
        </Swiper>
      </div>

      {total > 1 ? (
        <div
          className="mt-3.75 flex items-center justify-center gap-7"
          role="tablist"
          aria-label={`${alt} photos`}
        >
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Photo ${i + 1} of ${total}`}
              onClick={() => swiper?.slideToLoop(i)}
              className={
                'h-2.5 w-2.5 rounded-full transition-colors ' +
                (i === active ? 'bg-brand' : 'bg-white')
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default RestaurantPhotoSlider;
