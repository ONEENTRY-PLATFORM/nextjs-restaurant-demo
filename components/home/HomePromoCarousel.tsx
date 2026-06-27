'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { JSX, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { BlogBanner } from '@/app/api';

/** Autoplay interval between slides (ms). */
const AUTOPLAY_MS = 6000;

/**
 * HomePromoCarousel — full-width desktop promo rotator: scroll-snap slides with dot indicators
 * and (reduced-motion-aware, hover-paused) autoplay. Each slide links to its `/promo/<pageUrl>` page.
 *
 * Built on native CSS scroll-snap (no Swiper) to keep the home LCP path light and mirror
 * RelatedPromosCarousel. Touch devices swipe via native momentum scroll; desktop adds mouse
 * drag-to-swipe (pointer events, snap temporarily disabled mid-drag). The first slide keeps
 * `priority` so Chrome still picks the hero as the LCP candidate. Dots and autoplay are rendered
 * only when there is more than one banner.
 *
 * @param   {object}                        props         - Component props.
 * @param   {BlogBanner[]}                  props.banners - Banners with a desktop image, in display order.
 * @param   {Record<number, string | null>} props.blur    - base64 LQIP keyed by banner id (desktop preview).
 * @returns JSX of the desktop promo carousel.
 */
const HomePromoCarousel = ({
  banners,
  blur,
}: {
  banners: BlogBanner[];
  blur: Record<number, string | null>;
}): JSX.Element => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false, pointerId: -1 });
  const [dragging, setDragging] = useState(false);
  const multiple = banners.length > 1;

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const children = Array.from(el.children) as HTMLElement[];
      const { scrollLeft } = el;
      let nearest = 0;
      let nearestDelta = Infinity;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child) continue;
        const delta = Math.abs(child.offsetLeft - el.offsetLeft - scrollLeft);
        if (delta < nearestDelta) {
          nearest = i;
          nearestDelta = delta;
        }
      }
      setActiveIndex(nearest);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      el.removeEventListener('scroll', update);
    };
  }, [banners.length]);

  useEffect(() => {
    if (!multiple) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const el = scrollerRef.current;
    let paused = false;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    el?.addEventListener('pointerenter', pause);
    el?.addEventListener('pointerleave', resume);

    const id = window.setInterval(() => {
      if (paused || document.hidden || !el) return;
      const next = (activeRef.current + 1) % banners.length;
      const child = el.children[next] as HTMLElement | undefined;
      if (child) {
        el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
      }
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(id);
      el?.removeEventListener('pointerenter', pause);
      el?.removeEventListener('pointerleave', resume);
    };
  }, [multiple, banners.length]);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Touch/pen keep native horizontal scroll (momentum + snap); only mouse needs JS drag.
    if (e.pointerType !== 'mouse' || !multiple) return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
    // Mandatory snap overrides programmatic scrollLeft mid-drag — disable it while dragging.
    el.style.scrollSnapType = 'none';
    el.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 5) drag.moved = true;
    el.scrollLeft = drag.startScroll - dx;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    const el = scrollerRef.current;
    if (el) {
      if (el.hasPointerCapture(drag.pointerId)) el.releasePointerCapture(drag.pointerId);
      // Re-enable mandatory snap → the browser settles to the nearest slide.
      el.style.scrollSnapType = '';
    }
    setDragging(false);
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Swallow the click that ends a drag so it doesn't navigate to the promo page.
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  return (
    <div className="w-full">
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className={
          'flex w-full snap-x snap-mandatory overflow-x-auto no-scrollbar select-none ' +
          (multiple ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : '')
        }
      >
        {banners.map((b, i) => (
          <Link
            key={b.id}
            href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
            title={b.title}
            draggable={false}
            className="block w-full shrink-0 snap-start overflow-hidden rounded-panel transition-transform duration-500 hover:scale-[1.01]"
          >
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
          </Link>
        ))}
      </div>

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
              aria-selected={i === activeIndex}
              aria-label={`Promo ${i + 1} of ${banners.length}: ${b.title}`}
              onClick={() => scrollToIndex(i)}
              className={
                'h-2.5 w-2.5 rounded-full transition-colors ' +
                (i === activeIndex ? 'bg-brand' : 'bg-white')
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default HomePromoCarousel;
