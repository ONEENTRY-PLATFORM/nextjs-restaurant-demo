'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useSearchParams } from 'next/navigation';
import type { FC, ReactNode } from 'react';
import { useRef } from 'react';

/**
 * Card animations
 * @param props
 * @param props.children
 * @param props.className
 * @param props.index
 * @param props.pagesLimit
 * @see {@link https://gsap.com/cheatsheet/ gsap cheatsheet}
 * @returns Card animations
 */
const CardAnimations: FC<{
  children: ReactNode;
  className: string;
  index: number;
  pagesLimit: number;
}> = ({ children, className, index, pagesLimit }) => {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const ref = useRef(null);
  const delay = (index - (currentPage - 1) * pagesLimit) / 10;

  // entering animations
  useGSAP(() => {
    const tl = gsap.timeline({});

    const img =
      ref.current &&
      (ref.current as HTMLDivElement).getElementsByTagName('img');

    tl.set(ref.current, {
      autoAlpha: 0,
      scale: 0,
    })
      .set(img, {
        autoAlpha: 0,
      })
      .to(ref.current, {
        autoAlpha: 1,
        scale: 1,
        delay: delay > 0 ? delay : 0,
        duration: 0.6,
      })
      .to(img, {
        autoAlpha: 1,
        duration: 0.6,
        stagger: 0.1,
      });

    return () => {
      tl.kill();
    };
  }, []);

  useGSAP(() => {
    if (!ref.current) {
      return;
    }
    const isInViewport = ScrollTrigger.isInViewport(ref.current, 0.05);

    if (isInViewport === true || isInViewport === null) {
      (ref.current as HTMLDivElement).classList.add('in-view');
    } else {
      (ref.current as HTMLDivElement).classList.remove('in-view');
    }
  }, []);

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
};

export default CardAnimations;
