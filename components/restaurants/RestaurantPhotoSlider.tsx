'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';

type Photo = { downloadLink?: string };

/**
 * Слайдер фото ресторана — клиентский компонент с dot-индикаторами.
 * Повторяет паттерн `static-html/mob_about.html` (горизонтальная лента
 * + точки), но переключение делает по клику на точку, а не через
 * scroll-snap, чтобы стабильно работало на десктопе.
 *
 * `onImageClick` — опциональный обработчик клика по самому изображению.
 * Когда он задан, image-frame оборачивается в `<button>`. Точки-индикаторы
 * выводятся **рядом** (sibling), а не внутри этой кнопки, чтобы не
 * получалось `<button>` внутри `<button>` — иначе React падает на
 * hydration-mismatch (HTML не разрешает вложенные интерактивные
 * элементы).
 */
const RestaurantPhotoSlider = ({
  photos,
  alt,
  frameClassName = 'aspect-[16/9] md:aspect-[2.4/1]',
  sizes = '(min-width: 1280px) 1292px, (min-width: 1024px) 1000px, (min-width: 768px) 700px, 100vw',
  priority = true,
  onImageClick,
}: {
  photos: Photo[];
  alt: string;
  frameClassName?: string;
  sizes?: string;
  priority?: boolean;
  onImageClick?: () => void;
}): JSX.Element => {
  const [active, setActive] = useState(0);
  const total = photos.length;
  const current = photos[active]?.downloadLink;

  const frameClasses = 'relative w-full overflow-hidden rounded-[10px] bg-ink/40 ' + frameClassName;

  const frameContent = current ? (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
      priority={priority}
    />
  ) : null;

  return (
    <div>
      {onImageClick ? (
        <button
          type="button"
          onClick={onImageClick}
          aria-label={`Open ${alt} photo fullscreen`}
          className={frameClasses + ' transition-opacity hover:opacity-95 disabled:cursor-default'}
          disabled={total === 0}
        >
          {frameContent}
        </button>
      ) : (
        <div className={frameClasses}>{frameContent}</div>
      )}
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
              onClick={() => setActive(i)}
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
