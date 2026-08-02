'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { BlogBanner } from '@/components/promo/blogBanner';

/**
 * RelatedPromosCarousel — horizontal scroll-snap rail of "related promos" with dot indicators.
 *
 * @param   {object}        props        - Component props.
 * @param   {BlogBanner[]}  props.promos - Promo banners to render in the rail.
 * @returns JSX of the carousel with sibling dot tablist.
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
        className="no-scrollbar flex snap-x snap-mandatory gap-15 overflow-x-auto"
      >
        {promos.map(b => (
          <Link
            key={b.id}
            href={b.pageUrl ? `/promotions/${b.pageUrl}` : '#'}
            prefetch={false}
            title={b.title}
            className="block w-full shrink-0 snap-start overflow-hidden transition-transform duration-500 hover:scale-102 md:w-[calc((100%-60px)/2)]"
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
