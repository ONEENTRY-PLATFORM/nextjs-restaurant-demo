'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX } from 'react';
import { useRef } from 'react';

import type { AnimationsProps } from '@/app/types/global';

/**
 * TableRowAnimations — slide-up reveal for cart table rows (per-row stagger driven by `index`).
 *
 * @param   {AnimationsProps} props           - Component props.
 * @param   {ReactNode}       props.children  - Row content.
 * @param   {string}          props.className - Class merged onto the wrapping `<div>`.
 * @param   {number}          props.index     - Row index used to compute the stagger delay.
 * @returns {JSX.Element} JSX wrapper around the row content.
 */
const TableRowAnimations = ({ children, className, index }: AnimationsProps): JSX.Element => {
  const ref = useRef(null);

  useGSAP(() => {
    if (!ref.current) {
      return;
    }
    const tl = gsap.timeline({
      paused: true,
    });

    tl.set(ref.current, {
      opacity: 0,
      yPercent: 200,
    }).to(ref.current, {
      opacity: 1,
      yPercent: 0,
      delay: index / 10,
    });
    tl.play();

    return () => {
      tl.kill();
    };
  }, [ref]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default TableRowAnimations;
