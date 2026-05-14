'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useSearchParams } from 'next/navigation';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { useRef, useState } from 'react';

const HIDDEN_STYLE: CSSProperties = {
  opacity: 0,
  visibility: 'hidden',
  transform: 'translate3d(0, 0, 0)',
};

/**
 * CardAnimations — wraps a product card in a reveal animation that fires when it enters the viewport.
 *
 * @param   {object}    props               - Component props.
 * @param   {ReactNode} props.children      - Card content.
 * @param   {string}    props.className     - Class merged onto the wrapping `<div>`.
 * @param   {number}    props.index         - Absolute card index across all pages; drives the stagger.
 * @param   {number}    props.productsLimit - Page size; resets the stagger on a new page.
 * @returns JSX wrapper with the bound GSAP reveal animation.
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
  const [currentPageOnMount] = useState(() => Number(searchParams.get('page')) || 1);

  const ref = useRef<HTMLDivElement | null>(null);
  const delay = Math.max(0, (index - (currentPageOnMount - 1) * productsLimit) / 10);

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
          duration: 0.43,
          delay,
        });
      },
    });

    return () => {
      tl?.kill();
      trigger.kill();
    };
  }, []);

  return (
    <div ref={ref} className={className} style={HIDDEN_STYLE}>
      {children}
    </div>
  );
};

export default CardAnimations;
