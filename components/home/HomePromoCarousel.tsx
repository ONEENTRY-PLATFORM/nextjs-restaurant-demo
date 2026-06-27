'use client';

import 'swiper/css';

import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { A11y, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';

import type { BlogBanner } from '@/app/api';

/** Autoplay interval between slides (ms). */
const AUTOPLAY_MS = 6000;

/**
 * HomePromoCarousel — Swiper-driven promo rotator shared across breakpoints via `variant`.
 *
 * Desktop renders one full-width slide per view (the `section_layout` wrapper constrains the width);
 * mobile renders fixed-width `347px` cards with a peek of the next via `slidesPerView="auto"`. Both
 * variants autoplay (paused on hover, resumed after touch) and stop autoplay under
 * `prefers-reduced-motion`. Active state drives the dot tablist; dots call `slideToLoop` so they stay
 * correct with `loop`. Swiper suppresses the click that ends a drag, so a swipe never navigates.
 *
 * @param   {object}                         props         - Component props.
 * @param   {BlogBanner[]}                   props.banners - Banners (already filtered to the variant's image), in display order.
 * @param   {Record<number, string | null>}  props.blur    - base64 LQIP keyed by banner id (matching the variant's image).
 * @param   {'desktop' | 'mobile'}           props.variant - Layout variant: full-width slides vs peeking `347px` cards.
 * @returns JSX of the promo carousel.
 */
const HomePromoCarousel = ({
  banners,
  blur,
  variant,
}: {
  banners: BlogBanner[];
  blur: Record<number, string | null>;
  variant: 'desktop' | 'mobile';
}): JSX.Element => {
  const isDesktop = variant === 'desktop';
  const multiple = banners.length > 1;
  const [active, setActive] = useState(0);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  useEffect(() => {
    if (!swiper?.autoplay) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      swiper.autoplay.stop();
    }
  }, [swiper]);

  return (
    <div className="w-full">
      <Swiper
        modules={[Autoplay, A11y]}
        loop={multiple}
        autoplay={
          multiple
            ? { delay: AUTOPLAY_MS, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false
        }
        onSwiper={setSwiper}
        onSlideChange={s => setActive(s.realIndex)}
        {...(isDesktop
          ? { slidesPerView: 1 as const }
          : { slidesPerView: 'auto' as const, spaceBetween: 10 })}
        className="w-full cursor-grab active:cursor-grabbing"
      >
        {banners.map((b, i) => (
          <SwiperSlide key={b.id} className={isDesktop ? '' : 'w-86.75!'}>
            <Link
              href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
              title={b.title}
              draggable={false}
              className={
                isDesktop
                  ? 'block w-full overflow-hidden rounded-panel transition-transform duration-500 hover:scale-[1.01]'
                  : 'relative block h-36.25 w-full overflow-hidden rounded-panel'
              }
            >
              {isDesktop ? (
                <Image
                  src={b.desktopImage as string}
                  alt={b.title}
                  draggable={false}
                  width={1292}
                  height={192}
                  priority={i === 0}
                  sizes="(min-width: 1280px) 1292px, (min-width: 1024px) 1000px, 700px"
                  className="h-auto w-full object-cover"
                  {...(blur[b.id]
                    ? { placeholder: 'blur' as const, blurDataURL: blur[b.id] as string }
                    : {})}
                />
              ) : (
                <Image
                  src={b.mobileImage as string}
                  alt={b.title}
                  fill
                  draggable={false}
                  sizes="347px"
                  className="object-cover"
                  {...(blur[b.id]
                    ? { placeholder: 'blur' as const, blurDataURL: blur[b.id] as string }
                    : {})}
                />
              )}
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {multiple ? (
        <div
          className="mt-5 flex items-center justify-center gap-3"
          role="tablist"
          aria-label="Promotions"
        >
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Promo ${i + 1} of ${banners.length}: ${b.title}`}
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

export default HomePromoCarousel;
