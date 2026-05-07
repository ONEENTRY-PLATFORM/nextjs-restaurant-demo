'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

type Photo = { downloadLink?: string };

// Свайп считается жестом смены фото, если горизонтальное смещение превысило этот порог.
const SWIPE_THRESHOLD_PX = 40;
// Порог, после которого drag-жест перехватывается как горизонтальный (capture pointer).
const DIRECTION_LOCK_PX = 8;

/**
 * Слайдер фото ресторана — клиентский компонент с dot-индикаторами,
 * горизонтальным свайпом (touch + mouse drag) и автопрокруткой.
 *
 * Повторяет паттерн `static-html/mob_about.html` (горизонтальная лента
 * + точки), но переключение делает по pointer-событиям, а не через
 * scroll-snap, чтобы стабильно работало и на десктопе, и в lightbox-обёртке.
 *
 * `onImageClick` — опциональный обработчик клика по самому изображению.
 * Когда он задан, image-frame оборачивается в `<button>`. Точки-индикаторы
 * выводятся **рядом** (sibling), а не внутри этой кнопки, чтобы не
 * получалось `<button>` внутри `<button>` — иначе React падает на
 * hydration-mismatch (HTML не разрешает вложенные интерактивные
 * элементы). Click после swipe-жеста подавляется в `onClickCapture`,
 * чтобы свайп не открывал lightbox.
 *
 * Автопрокрутка: каждые `autoplayMs` мс активный слайд продвигается на
 * следующий (циклически). Эффект пересоздаётся при смене `active`, поэтому
 * ручное переключение (свайп/тап по точке) корректно сбрасывает таймер.
 * Пока пользователь держит палец/мышь — автопрокрутка пауза. Передать
 * `autoplayMs={null}` чтобы выключить.
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
  const [paused, setPaused] = useState(false);
  const total = photos.length;

  useEffect(() => {
    if (!autoplayMs || total < 2 || paused) return;
    const id = window.setInterval(() => {
      setActive(i => (i + 1) % total);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, total, paused, active]);

  const dragState = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    moved: number;
    direction: 0 | 1 | -1;
    locked: boolean;
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    moved: 0,
    direction: 0,
    locked: false,
  });

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (total < 2) return;
    dragState.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: 0,
      direction: 0,
      locked: false,
    };
    setPaused(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = dragState.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    s.moved = Math.abs(dx);
    s.direction = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    // Lock в горизонтальный жест только когда горизонтальная компонента
    // явно доминирует — иначе пропускаем вертикальный скролл страницы.
    if (!s.locked && Math.abs(dx) > DIRECTION_LOCK_PX && Math.abs(dx) > Math.abs(dy)) {
      s.locked = true;
      try {
        e.currentTarget.setPointerCapture(s.pointerId);
      } catch {
        // pointerId уже мог быть отпущен (быстрый flick) — не критично.
      }
    }
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLElement>) => {
    const s = dragState.current;
    const target = e.currentTarget;
    if (s.locked && target.hasPointerCapture(s.pointerId)) {
      target.releasePointerCapture(s.pointerId);
    }
    if (s.locked && s.moved > SWIPE_THRESHOLD_PX && total > 0) {
      // Свайп вправо (direction = 1) → предыдущий слайд; влево → следующий.
      const delta = s.direction === 1 ? -1 : 1;
      setActive(i => (i + delta + total) % total);
    }
    s.active = false;
    setPaused(false);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    // Подавляем click после swipe-жеста — иначе по button-варианту откроется
    // lightbox прямо при отпускании пальца.
    if (dragState.current.moved > SWIPE_THRESHOLD_PX) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const frameClasses =
    'relative w-full overflow-hidden rounded-[10px] bg-ink/40 select-none touch-pan-y ' +
    frameClassName;

  const dragHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onPointerLeave: onPointerEnd,
    onClickCapture,
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
  };

  // Все слайды монтируем одновременно и переключаем `opacity` — получаем
  // плавный crossfade при смене активного фото (свайп / тап по точке /
  // автопрокрутка). `priority` ставим только на первое, чтобы не утащить
  // LCP в фон.
  const frameContent =
    total > 0
      ? photos.map((p, i) =>
          p?.downloadLink ? (
            <Image
              key={i}
              src={p.downloadLink}
              alt={i === active ? alt : ''}
              fill
              sizes={sizes}
              className={
                'object-cover pointer-events-none select-none transition-opacity duration-500 ' +
                (i === active ? 'opacity-100' : 'opacity-0')
              }
              draggable={false}
              priority={priority && i === 0}
            />
          ) : null
        )
      : null;

  const grabClass = total > 1 ? ' cursor-grab active:cursor-grabbing' : '';

  return (
    <div>
      {onImageClick ? (
        <button
          type="button"
          onClick={onImageClick}
          aria-label={`Open ${alt} photo fullscreen`}
          className={
            frameClasses +
            grabClass +
            ' transition-opacity hover:opacity-95 disabled:cursor-default'
          }
          disabled={total === 0}
          {...dragHandlers}
        >
          {frameContent}
        </button>
      ) : (
        <div className={frameClasses + grabClass} {...dragHandlers}>
          {frameContent}
        </div>
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
