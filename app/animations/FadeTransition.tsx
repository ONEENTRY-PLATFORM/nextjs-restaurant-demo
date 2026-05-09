'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX } from 'react';
import { useRef } from 'react';

import type { AnimationsProps } from '../types/global';

/**
 * FadeTransition — анимация плавного появления (fade) c stagger по `index`.
 *
 * @param   {AnimationsProps} props           - Свойства анимации.
 * @param   {ReactNode}       props.children  - Дочерний ReactNode.
 * @param   {string}          props.className - CSS className ref-элемента.
 * @param   {number}          props.index     - Индекс элемента для stagger-анимаций.
 * @returns {JSX.Element}                     JSX с анимированным ref.
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
