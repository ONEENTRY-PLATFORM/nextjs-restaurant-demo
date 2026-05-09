'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useSearchParams } from 'next/navigation';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { useRef } from 'react';

const HIDDEN_STYLE: CSSProperties = {
  opacity: 0,
  visibility: 'hidden',
  transform: 'scale(0)',
};

/**
 * Card reveal animation. Cards start hidden via inline style (no flash before
 * GSAP boots), then either animate immediately (if already in the viewport on
 * mount, with a small stagger by `index`), or wait for the `ScrollTrigger` to
 * fire on scroll-in. Toggle `.in-view` so that {@link CardsGridAnimations} can
 * target only visible cards in the leaving animation.
 */
const CardAnimations = ({
  children,
  className,
  index,
  productsLimit,
}: {
  children: ReactNode;
  className: string;
  index: number;
  productsLimit: number;
}): JSX.Element => {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const ref = useRef<HTMLDivElement | null>(null);
  const delay = Math.max(0, (index - (currentPage - 1) * productsLimit) / 25);

  useGSAP(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const img = el.getElementsByTagName('img');

    const reveal = () => {
      el.classList.add('in-view');
      const tl = gsap.timeline();
      tl.to(el, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.25,
        delay,
      }).to(img, {
        autoAlpha: 1,
        duration: 0.25,
        stagger: 0.03,
      });
      return tl;
    };

    gsap.set(img, { autoAlpha: 0 });

    let tl: gsap.core.Timeline | null = null;
    let trigger: ScrollTrigger | null = null;

    if (ScrollTrigger.isInViewport(el, 0.5)) {
      tl = reveal();
    } else {
      trigger = ScrollTrigger.create({
        trigger: el,
        start: 'center 95%',
        once: true,
        onEnter: () => {
          tl = reveal();
        },
      });
    }

    return () => {
      tl?.kill();
      trigger?.kill();
    };
  }, [delay]);

  return (
    <div ref={ref} className={className} style={HIDDEN_STYLE}>
      {children}
    </div>
  );
};

export default CardAnimations;
