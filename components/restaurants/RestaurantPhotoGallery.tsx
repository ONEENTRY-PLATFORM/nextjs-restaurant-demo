'use client';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import Image from 'next/image';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import RestaurantPhotoSlider from './RestaurantPhotoSlider';

type Photo = { downloadLink?: string };

/**
 * RestaurantPhotoGallery — галерея single-restaurant с lightbox-ом.
 * Мобила: горизонтальный слайдер через {@link RestaurantPhotoSlider}; тап открывает lightbox.
 */
const RestaurantPhotoGallery = ({ photos, alt }: { photos: Photo[]; alt: string }): JSX.Element => {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = photos.length;
  const main = photos[active];

  // Вертикальная карусель миниатюр.
  const thumbsContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragState = useRef<{
    active: boolean;
    captured: boolean;
    pointerId: number;
    startY: number;
    startScroll: number;
    moved: number;
  }>({
    active: false,
    captured: false,
    pointerId: -1,
    startY: 0,
    startScroll: 0,
    moved: 0,
  });
  const DRAG_THRESHOLD_PX = 5;

  useEffect(() => {
    const container = thumbsContainerRef.current;
    const node = thumbRefs.current[active];
    if (!container || !node) return;

    // Скролл считаем вручную и применяем ТОЛЬКО к thumbs-контейнеру (чтобы страница не дёргалась).
    const cRect = container.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();

    const relTop = nRect.top - cRect.top + container.scrollTop;
    const relBottom = relTop + nRect.height;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    // 1) Скрыт сверху — поднимаем на верх viewport'а.
    if (relTop < viewTop) {
      container.scrollTo({ top: relTop, behavior: 'smooth' });
      return;
    }

    // 2) Скрыт снизу — опускаем на нижнюю границу.
    if (relBottom > viewBottom) {
      container.scrollTo({
        top: relBottom - container.clientHeight,
        behavior: 'smooth',
      });
      return;
    }

    // 3) Виден, но крайний снизу — подкручиваем на один слайд вперёд, чтобы стал виден сосед.
    const next = thumbRefs.current[active + 1];
    if (next) {
      const nextRect = next.getBoundingClientRect();
      const nextRelBottom =
        nextRect.bottom - cRect.bottom + container.scrollTop + container.clientHeight;
      if (nextRect.bottom > cRect.bottom) {
        container.scrollTo({
          top: nextRelBottom - container.clientHeight,
          behavior: 'smooth',
        });
        return;
      }
    }
    // 4) Симметрично — крайний сверху.
    const prev = thumbRefs.current[active - 1];
    if (prev) {
      const prevRect = prev.getBoundingClientRect();
      if (prevRect.top < cRect.top) {
        const prevRelTop = prevRect.top - cRect.top + container.scrollTop;
        container.scrollTo({ top: prevRelTop, behavior: 'smooth' });
      }
    }
  }, [active]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = thumbsContainerRef.current;
    if (!el) return;
    if (e.button !== undefined && e.button !== 0) return;
    dragState.current = {
      active: true,
      captured: false,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScroll: el.scrollTop,
      moved: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    const el = thumbsContainerRef.current;
    if (!s.active || !el) return;
    const dy = e.clientY - s.startY;
    const moved = Math.abs(dy);
    if (moved < DRAG_THRESHOLD_PX) return;
    s.moved = Math.max(s.moved, moved);
    if (!s.captured) {
      el.setPointerCapture(s.pointerId);
      s.captured = true;
    }
    el.scrollTop = s.startScroll - dy;
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = thumbsContainerRef.current;
    const s = dragState.current;
    if (el && s.captured && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    s.active = false;
    s.captured = false;
    setTimeout(() => {
      dragState.current.moved = 0;
    }, 0);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved > DRAG_THRESHOLD_PX) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Drag-swipe для main-фото (левая колонка).
  const MAIN_DRAG_THRESHOLD_PX = 40;
  const mainDragState = useRef<{
    active: boolean;
    startY: number;
    moved: number;
    direction: 0 | 1 | -1;
  }>({ active: false, startY: 0, moved: 0, direction: 0 });

  const onMainPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== undefined && e.button !== 0) return;
    mainDragState.current = {
      active: true,
      startY: e.clientY,
      moved: 0,
      direction: 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMainPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = mainDragState.current;
    if (!s.active) return;
    const dy = e.clientY - s.startY;
    s.moved = Math.abs(dy);
    s.direction = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  };

  const onMainPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = mainDragState.current;
    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    if (s.moved > MAIN_DRAG_THRESHOLD_PX && total > 0) {
      // Вверх → следующее, вниз → предыдущее. Циклически.
      const delta = s.direction === -1 ? 1 : -1;
      setActive(i => (i + delta + total) % total);
    }
    s.active = false;
  };

  const onMainClickCapture = (e: React.MouseEvent<HTMLButtonElement>) => {
    // После swipe подавляем click, чтобы не открывать lightbox.
    if (mainDragState.current.moved > MAIN_DRAG_THRESHOLD_PX) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const slides = photos
    .filter((p): p is Required<Photo> => Boolean(p?.downloadLink))
    .map(p => ({ src: p.downloadLink, alt }));

  const openLightbox = () => {
    if (slides.length > 0) setLightboxOpen(true);
  };

  return (
    <>
      {/* Mobile / tablet — слайдер с точками. */}
      <div className="md:hidden">
        <RestaurantPhotoSlider
          photos={photos}
          alt={alt}
          frameClassName="aspect-956/678"
          sizes="(max-width: 767px) 100vw, 700px"
          onImageClick={openLightbox}
        />
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid md:aspect-1294/678 md:grid-cols-[956fr_278fr] md:gap-15">
        <button
          type="button"
          onClick={openLightbox}
          onClickCapture={onMainClickCapture}
          onPointerDown={onMainPointerDown}
          onPointerMove={onMainPointerMove}
          onPointerUp={onMainPointerEnd}
          onPointerCancel={onMainPointerEnd}
          onPointerLeave={onMainPointerEnd}
          onDragStart={e => e.preventDefault()}
          aria-label={`Open ${alt} photos fullscreen`}
          className="relative h-full w-full overflow-hidden rounded-[10px] bg-ink/40 transition-opacity hover:opacity-95 disabled:cursor-default cursor-grab active:cursor-grabbing select-none touch-pan-y"
          disabled={total === 0}
        >
          {main?.downloadLink ? (
            <Image
              src={main.downloadLink}
              alt={alt}
              fill
              sizes="(min-width: 1280px) 956px, 60vw"
              className="object-cover pointer-events-none select-none"
              draggable={false}
              priority
            />
          ) : null}
        </button>
        <div
          ref={thumbsContainerRef}
          className="flex h-full min-h-0 flex-col gap-11 overflow-y-auto px-1 no-scrollbar touch-pan-y select-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
          onClickCapture={onClickCapture}
        >
          {photos.map((photo, index) => {
            const isActive = index === active;
            return (
              <button
                key={index}
                ref={el => {
                  thumbRefs.current[index] = el;
                }}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={isActive}
                className={
                  'relative aspect-278/197 w-full shrink-0 overflow-hidden rounded-[10px] bg-ink/40 transition-all ' +
                  (isActive ? 'ring-2 ring-brand opacity-100' : 'opacity-70 hover:opacity-100')
                }
              >
                {photo?.downloadLink ? (
                  <Image
                    src={photo.downloadLink}
                    alt={`${alt} ${index + 1}`}
                    fill
                    sizes="(min-width: 1280px) 278px, 20vw"
                    className="object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                ) : null}
              </button>
            );
          })}
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
