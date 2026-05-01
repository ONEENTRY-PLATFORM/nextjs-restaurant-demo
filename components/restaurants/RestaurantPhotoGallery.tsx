'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import RestaurantPhotoSlider from './RestaurantPhotoSlider';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

type Photo = { downloadLink?: string };

/**
 * Галерея single-restaurant (Figma «Подробнее 2», node 2413:1173).
 *
 * Десктоп: большое фото слева — область показа; столбец миниатюр
 * справа. Клик по миниатюре переключает основное фото; клик по
 * основному — открывает fullscreen-lightbox (`yet-another-react-lightbox`)
 * со встроенной клавиатурной навигацией, swipe, zoom, fullscreen API
 * и thumbnail-strip'ом снизу.
 *
 * Мобила: единый горизонтальный слайдер через {@link RestaurantPhotoSlider}
 * (как в `mob_about.html`); тап по фото открывает тот же lightbox.
 */
const RestaurantPhotoGallery = ({
  photos,
  alt,
}: {
  photos: Photo[];
  alt: string;
}): JSX.Element => {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = photos.length;
  const main = photos[active];
  // Превьюшки — все, кроме активного, обрезанные до 3, чтобы вписаться
  // в Figma-сетку (1 main + 3 thumbs справа). Остальные доступны
  // через lightbox-навигацию.
  const thumbs = photos
    .map((photo, index) => ({ photo, index }))
    .filter(({ index }) => index !== active)
    .slice(0, 3);

  const slides = photos
    .filter((p): p is Required<Photo> => Boolean(p?.downloadLink))
    .map((p) => ({ src: p.downloadLink, alt }));

  const openLightbox = () => {
    if (slides.length > 0) setLightboxOpen(true);
  };

  return (
    <>
      {/* Mobile / tablet — слайдер с точками. Сам по себе он не
          триггерит lightbox; обёртка-кнопка делает фото clickable
          под открытие lightbox. */}
      <button
        type="button"
        onClick={openLightbox}
        aria-label={`Open ${alt} photos fullscreen`}
        className="block w-full md:hidden"
      >
        <RestaurantPhotoSlider
          photos={photos}
          alt={alt}
          frameClassName="aspect-956/678"
          sizes="100vw"
        />
      </button>

      {/* Desktop — grid 1 main + 3 thumbnails */}
      <div className="hidden md:grid md:grid-cols-[956fr_278fr] md:gap-15">
        <button
          type="button"
          onClick={openLightbox}
          aria-label={`Open ${alt} photos fullscreen`}
          className="relative aspect-956/678 w-full overflow-hidden rounded-[10px] bg-ink/40 transition-opacity hover:opacity-95 disabled:cursor-default"
          disabled={total === 0}
        >
          {main?.downloadLink ? (
            <Image
              src={main.downloadLink}
              alt={alt}
              fill
              sizes="(min-width: 1280px) 956px, 60vw"
              className="object-cover"
              priority
            />
          ) : null}
        </button>
        <div className="flex flex-col gap-11">
          {thumbs.map(({ photo, index }) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              className="relative aspect-278/197 w-full overflow-hidden rounded-[10px] bg-ink/40 transition-opacity hover:opacity-90"
            >
              {photo?.downloadLink ? (
                <Image
                  src={photo.downloadLink}
                  alt={`${alt} ${index + 1}`}
                  fill
                  sizes="(min-width: 1280px) 278px, 20vw"
                  className="object-cover"
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={active}
        on={{ view: ({ index }) => setActive(index) }}
        slides={slides}
        plugins={[Counter, Fullscreen, Thumbnails, Zoom]}
        controller={{ closeOnBackdropClick: true }}
        // Бэкдроп подгоняем под общий стиль попапов проекта
        // (`bg-ink/80 backdrop-blur-[10px]` в ProfilePopup,
        // FavoritesPopup, Modal и т.п.). `--color-ink` = #4c4d56,
        // 80% непрозрачность + blur(10px) — переопределяем CSS-vars
        // самой либы, чтобы не плодить override-CSS.
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
