'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

/**
 * Staggered fade-in for the cart / orders promo sidebar — mirrors the
 * `ProductAnimations` first-load effect on cart line items so that the
 * sidebar banners ride in alongside the product list.
 *
 * @param   {object}   props           - Component props.
 * @param   {ReactNode} props.children - Banner element to animate.
 * @param   {number}   props.index     - Position in the list (drives stagger delay).
 * @param   {string}   [props.className] - Wrapper class.
 * @returns {JSX.Element}              Wrapped banner JSX.
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
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default PromoBannerAnimations;
