'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { JSX, ReactNode } from 'react';
import { useRef, useState } from 'react';

/**
 * ProductAnimations — fade-in/leaving wrapper for product page blocks with per-block stagger.
 *
 * @param   {object}      props           - Component props.
 * @param   {ReactNode}   props.children  - Block content to animate.
 * @param   {string}      props.className - Class merged onto the wrapping `<div>`.
 * @param   {number}      props.index     - Block index used to compute the stagger delay.
 * @returns JSX wrapper around the product block.
 */
const ProductAnimations = ({
  children,
  className,
  index,
}: {
  children: ReactNode;
  className: string;
  index: number;
}): JSX.Element => {
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState('');
  const ref = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      paused: true,
    });

    tl.set(ref.current, {
      autoAlpha: 0,
    }).to(ref.current, {
      autoAlpha: 1,
      delay: index / 10,
    });
    tl.play();

    return () => {
      tl.kill();
    };
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();

    if (stage === 'leaving' && prevStage === 'none') {
      tl.to(ref.current, {
        autoAlpha: 0,
        duration: 0.5,
        delay: index / 10,
      });
    }

    setPrevStage(stage);

    return () => {
      tl.kill();
    };
  }, [stage]);

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
};

export default ProductAnimations;
