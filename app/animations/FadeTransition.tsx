'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX } from 'react';
import { useRef } from 'react';

import type { AnimationsProps } from '../types/global';

/**
 * FadeTransition — fade-in animation with stagger driven by `index`.
 *
 * @param   {AnimationsProps} props           - Animation props.
 * @param   {ReactNode}       props.children  - Child ReactNode.
 * @param   {string}          props.className - CSS className for the ref element.
 * @param   {number}          props.index     - Element index for stagger animations.
 * @returns {JSX.Element}                     JSX with the animated ref.
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
