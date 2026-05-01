'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';

type Photo = { downloadLink?: string };

/**
 * Слайдер фото ресторана — клиентский компонент с dot-индикаторами и
 * клавиатурным переключением. Повторяет паттерн из `static-html/mob_about.html`
 * (горизонтальная лента + точки), но переключение делает по клику на точку,
 * а не через scroll-snap, чтобы стабильно работало на десктопе. Если фото
 * только одно — точки скрываем (нечего переключать). Если фото нет — рендерим
 * скелетон с dark background, чтобы не ломать layout страницы.
 *
 * Отдельным клиентским файлом — потому что состояние "активный индекс"
 * требует interactivity, а вся остальная страница ресторана (
 * `app/restaurants/[handle]/page.tsx`) — серверная.
 */
const RestaurantPhotoSlider = ({
  photos,
  alt,
  frameClassName = 'aspect-[16/9] md:aspect-[2.4/1]',
  sizes = '(min-width: 1280px) 1292px, (min-width: 1024px) 1000px, (min-width: 768px) 700px, 100vw',
  priority = true,
}: {
  photos: Photo[];
  alt: string;
  frameClassName?: string;
  sizes?: string;
  priority?: boolean;
}): JSX.Element => {
  const [active, setActive] = useState(0);
  const total = photos.length;
  const current = photos[active]?.downloadLink;

  return (
    <div>
      <div
        className={
          'relative w-full overflow-hidden rounded-[10px] bg-ink/40 ' +
          frameClassName
        }
      >
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            sizes={sizes}
            className="object-cover"
            priority={priority}
          />
        ) : null}
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
