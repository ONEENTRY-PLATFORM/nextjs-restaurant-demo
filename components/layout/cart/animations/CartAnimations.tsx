'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { JSX } from 'react';
import { useRef, useState } from 'react';

import type { AnimationsProps } from '@/app/types/global';

/**
 * CartAnimations — cart wrapper animations: bottom-to-top leave-stagger on route transition (entrance is handled by per-component hooks).
 *
 * @param   {AnimationsProps} props           - Component props.
 * @param   {ReactNode}       props.children  - Cart subtree to animate on leave.
 * @param   {string}          props.className - Class merged onto the wrapping `<div>`.
 * @returns JSX wrapper that staggers the leave animation.
 */
const CartAnimations = ({ children, className }: AnimationsProps): JSX.Element => {
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState<string>('');
  const ref = useRef(null);

  useGSAP(() => {
    if (stage !== 'leaving' || prevStage !== 'none') {
      setPrevStage(stage);
      return undefined;
    }
    const targets = gsap.utils.toArray<HTMLElement>(
      '.product-in-cart, .tr, #total, .cart-apply-btn'
    );
    if (targets.length === 0) {
      setPrevStage(stage);
      return undefined;
    }
    const tl = gsap.to(targets, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 0.4,
      stagger: { each: 0.07, from: 'end' },
    });
    setPrevStage(stage);
    return () => {
      tl.kill();
    };
  }, [stage]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default CartAnimations;
