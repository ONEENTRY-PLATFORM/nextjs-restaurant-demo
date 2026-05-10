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
  transform: 'translate3d(0, 0, 0)',
};

/**
 * Card reveal animation. Each card fades in when it scrolls into view, with a
 * per-row stagger via `delay`. Cards already in or near the viewport on mount
 * are revealed immediately because `ScrollTrigger.create` evaluates the start
 * position synchronously and fires `onEnter` for triggers that are already
 * past their threshold — single code path covers both the in-viewport and
 * scroll-into-view cases (was a branched `isInViewport / create` pair, which
 * left invisible cards stranded on deep `?page=N` URLs when they fell just
 * outside the strict 45% viewport check).
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
  const delay = Math.max(0, (index - (currentPage - 1) * productsLimit) / 10);

  useGSAP(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    let tl: gsap.core.Timeline | null = null;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 95%',
      once: true,
      onEnter: () => {
        el.classList.add('in-view');
        tl = gsap.timeline().to(el, {
          autoAlpha: 1,
          duration: 0.3,
          delay,
        });
      },
    });

    return () => {
      tl?.kill();
      trigger.kill();
    };
  }, [delay]);

  return (
    <div ref={ref} className={className} style={HIDDEN_STYLE}>
      {children}
    </div>
  );
};

export default CardAnimations;
