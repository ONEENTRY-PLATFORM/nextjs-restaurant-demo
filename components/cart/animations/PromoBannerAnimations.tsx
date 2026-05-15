'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

/**
 * PromoBannerAnimations — stagger fade-in wrapper for the cart / orders promo sidebar banners.
 *
 * @param   {object}    props           - Component props.
 * @param   {ReactNode} props.children  - Banner element to animate.
 * @param   {number}    props.index     - Position in the list (drives the stagger delay).
 * @param   {string}    [props.className] - Wrapper class merged onto the animated container.
 * @returns JSX of the wrapped banner.
 */
const PromoBannerAnimations = ({
  children,
  index,
  className,
}: {
  children: ReactNode;
  index: number;
  className?: string;
}): JSX.Element => {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const tl = gsap.timeline({ paused: true });
    tl.set(ref.current, { opacity: 0, yPercent: 100 }).to(ref.current, {
      opacity: 1,
      yPercent: 0,
      delay: index / 10,
    });
    tl.play();
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} className={className} data-promo-banner="">
      {children}
    </div>
  );
};

export default PromoBannerAnimations;
