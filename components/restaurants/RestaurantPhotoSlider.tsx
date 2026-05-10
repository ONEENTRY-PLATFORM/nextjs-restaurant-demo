'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

type Photo = { downloadLink?: string };

// A swipe is treated as a photo-change gesture once horizontal displacement exceeds this threshold.
const SWIPE_THRESHOLD_PX = 40;
// Threshold past which the drag gesture is captured as horizontal (pointer capture).
const DIRECTION_LOCK_PX = 8;

/**
 * RestaurantPhotoSlider — restaurant photo slider with dot indicators, swipe, and autoplay.
 *
 * If `onImageClick` is provided, dots are rendered as a sibling to avoid `<button>` inside `<button>`.
 * Pass `autoplayMs={null}` to disable autoplay.
 *
 * @param   {object}        props                    - Component props.
 * @param   {Photo[]}       props.photos             - List of photos with `downloadLink` URLs.
 * @param   {string}        props.alt                - Accessible alt text used for the active slide.
 * @param   {string}        [props.frameClassName]   - Aspect-ratio class applied to the slider frame.
 * @param   {string}        [props.sizes]            - `<Image sizes>` directive for the slides.
 * @param   {boolean}       [props.priority]         - When `true`, the first slide is loaded with `priority`.
 * @param   {() => void}    [props.onImageClick]     - When provided, the frame becomes a `<button>` opening the lightbox.
 * @param   {number | null} [props.autoplayMs]       - Autoplay interval in ms (`null` disables autoplay).
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
    // Lock into a horizontal gesture only when the horizontal component dominates - otherwise let vertical scroll through.
    if (!s.locked && Math.abs(dx) > DIRECTION_LOCK_PX && Math.abs(dx) > Math.abs(dy)) {
      s.locked = true;
      try {
        e.currentTarget.setPointerCapture(s.pointerId);
      } catch {
        // pointerId may already have been released (fast flick).
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
      // Swipe right (direction = 1) -> previous slide; left -> next.
      const delta = s.direction === 1 ? -1 : 1;
      setActive(i => (i + delta + total) % total);
    }
    s.active = false;
    setPaused(false);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    // Suppress click after a swipe gesture - otherwise the lightbox would open on finger release.
    if (dragState.current.moved > SWIPE_THRESHOLD_PX) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const frameClasses =
    'relative w-full overflow-hidden rounded-panel bg-ink/40 select-none touch-pan-y ' +
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

  // Mount all slides at once and toggle `opacity` for a smooth crossfade. `priority` only on the first to avoid hurting LCP.
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
