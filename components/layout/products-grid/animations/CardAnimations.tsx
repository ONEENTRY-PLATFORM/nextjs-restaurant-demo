'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useSearchParams } from 'next/navigation';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { useRef, useState } from 'react';

import { useHeaderAnimationComplete } from '@/app/animations/useHeaderAnimationComplete';

const HIDDEN_STYLE: CSSProperties = {
  opacity: 0,
  visibility: 'hidden',
  transform: 'translate3d(0, 0, 0)',
};

/**
 * CardAnimations — wraps a product card in a reveal animation that fires when it enters the viewport.
 *
 * When `gateOnHeader` is set the viewport trigger is not armed until the initial header reveal
 * finishes, so skeleton-grid cards never flash in underneath the still-animating header on a cold
 * load. Real product cards leave it off and reveal as soon as they scroll into view. On a client-side
 * navigation the header animation is already complete, so the gate resolves immediately.
 *
 * @param   {object}    props                - Component props.
 * @param   {ReactNode} props.children       - Card content.
 * @param   {string}    props.className      - Class merged onto the wrapping `<div>`.
 * @param   {number}    props.index          - Absolute card index across all pages; drives the stagger.
 * @param   {number}    props.productsLimit  - Page size; resets the stagger on a new page.
 * @param   {boolean}   [props.gateOnHeader] - Defer the reveal until `HeaderAnimations` completes (used by the skeleton grid).
 * @returns JSX wrapper with the bound GSAP reveal animation.
 */
const CardAnimations = ({
  children,
  className,
  index,
  productsLimit,
  gateOnHeader = false,
}: {
  children: ReactNode;
  className: string;
  index: number;
  productsLimit: number;
  gateOnHeader?: boolean;
}): JSX.Element => {
  const searchParams = useSearchParams();
  const [currentPageOnMount] = useState(() => Number(searchParams.get('page')) || 1);
  /** Cards outside the header-gated grid start revealed; the rest follow the flag. */
  const headerReady = useHeaderAnimationComplete() || !gateOnHeader;

  const ref = useRef<HTMLDivElement | null>(null);
  const delay = Math.max(0, (index - (currentPageOnMount - 1) * productsLimit) / 10);

  useGSAP(
    () => {
      if (!headerReady) {
        return;
      }

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
            duration: 0.43,
            delay,
          });
        },
      });

      return () => {
        tl?.kill();
        trigger.kill();
      };
    },
    { dependencies: [headerReady] }
  );

  return (
    <div ref={ref} className={className} style={HIDDEN_STYLE}>
      {children}
    </div>
  );
};

export default CardAnimations;
