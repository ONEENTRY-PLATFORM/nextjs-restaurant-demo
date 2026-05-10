'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX } from 'react';
import { useRef } from 'react';

import type { AnimationsProps } from '../types/global';

/**
 * FadeTransition — fade-in animation with stagger driven by `index`.
 *
 * @param   {AnimationsProps} props           - Component props.
 * @param   {ReactNode}       props.children  - Subtree to fade in.
 * @param   {string}          props.className - CSS className for the wrapper `<div>` (always merged with `opacity-0`).
 * @param   {number}          props.index     - Element index used to compute the per-card stagger delay.
 * @returns JSX wrapper that animates `autoAlpha` from 0 → 1 on mount.
 * @see {@link https://gsap.com/cheatsheet/ gsap cheatsheet}
 */
const FadeTransition = ({ children, className, index }: AnimationsProps): JSX.Element => {
  const ref = useRef(null);
  useGSAP(() => {
    const tl = gsap
      .timeline()
      .set(ref.current, {
        autoAlpha: 0,
      })
      .to(ref.current, {
        autoAlpha: 1,
        duration: 0.8,
        delay: index / 10,
      });
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} className={className + ' opacity-0'}>
      {children}
    </div>
  );
};

export default FadeTransition;
