'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { BlogBanner } from '@/app/api';

/**
 * Карусель «похожих промо» внизу страницы `/promo/[handle]` — горизонтальная
 * scroll-snap лента с dot-индикаторами под ней. Используется, когда соседних
 * промо-страниц минимум 3 (1-2 укладываются в обычный flex-ряд без свайпа).
 *
 * Текущая страница в массиве `promos` уже исключена — это всегда «другие»
 * промо-страницы, чтобы было что листать.
 *
 * Подход — нативный CSS scroll-snap (`overflow-x-auto snap-x snap-mandatory`)
 * + точки под лентой, как `RestaurantPhotoSlider`. Это легче, чем тянуть
 * `react-slick` ради такого случая, и совпадает с уже используемым в проекте
 * паттерном (см. мобильную ленту в `HomePromo`).
 */
const RelatedPromosCarousel = ({ promos }: { promos: BlogBanner[] }): JSX.Element => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
  }, [promos.length]);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({
      left: child.offsetLeft - el.offsetLeft,
      behavior: 'smooth',
    });
  };

  return (
    <div>
      <div
        ref={scrollerRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-15"
      >
        {promos.map(b => (
          <Link
            key={b.id}
            href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
            title={b.title}
            className="snap-start shrink-0 w-full md:w-[calc((100%-60px)/2)] block overflow-hidden rounded-[10px] transition-transform duration-500 hover:scale-[1.02]"
          >
            <Image
              src={b.mobileImage as string}
              alt={b.title}
              width={615}
              height={278}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-auto w-full"
            />
          </Link>
        ))}
      </div>
      <div
        className="mt-5 flex items-center justify-center gap-7"
        role="tablist"
        aria-label="Related promos"
      >
        {promos.map((b, i) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Promo ${i + 1} of ${promos.length}: ${b.title}`}
            onClick={() => scrollToIndex(i)}
            className={
              'h-2.5 w-2.5 rounded-full transition-colors ' +
              (i === activeIndex ? 'bg-brand' : 'bg-white')
            }
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedPromosCarousel;
