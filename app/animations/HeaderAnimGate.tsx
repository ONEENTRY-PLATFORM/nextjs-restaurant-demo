'use client';

import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import {
  isHeaderAnimationComplete,
  subscribeHeaderAnimation,
} from '@/app/animations/headerAnimState';

/**
 * HeaderAnimGate — defers fading in its children until `HeaderAnimations` finishes
 * the initial-load timeline, with an optional extra delay to chain blocks in order.
 *
 * Subscribes to the shared header-animation flag from `headerAnimState`. If the flag
 * is already `true` at mount (e.g. on a client-side navigation back to a page that
 * uses the gate), it fades in immediately (still honouring `delay`). The wrapper is
 * pre-hidden via the `data-after-header` CSS rule so SSR markup never flashes before
 * GSAP takes over.
 *
 * @param   {object}    props          - Component props.
 * @param   {ReactNode} props.children - Subtree to fade in after the header reveal.
 * @param   {number}    [props.delay]  - Extra seconds added before this gate's fade-in.
 *                                       Use to stagger consecutive gates (e.g. promo then recommended).
 * @returns JSX wrapper that fades its children once the header animation finishes.
 */
const HeaderAnimGate = ({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<boolean>(false);

  useEffect(() => {
    if (isHeaderAnimationComplete()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevealed(true);
      return undefined;
    }
    const unsubscribe = subscribeHeaderAnimation(() => setRevealed(true));
    return unsubscribe;
  }, []);

  // Plain `useEffect` (not `useLayoutEffect`/`useGSAP`) so GSAP only mutates inline
  // styles after the whole tree has hydrated — otherwise React reports a hydration
  // mismatch on the wrapping `<div>`'s `style` attribute. The CSS `[data-after-header]`
  // rule keeps the subtree invisible during the gap between paint and effect.
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!revealed) {
      gsap.set(node, { autoAlpha: 0 });
      return undefined;
    }
    const tween = gsap.to(node, {
      autoAlpha: 1,
      duration: 0.5,
      delay,
      ease: 'power2.out',
    });
    return () => {
      tween.kill();
    };
  }, [revealed, delay]);

  return (
    <div ref={ref} data-after-header>
      {children}
    </div>
  );
};

export default HeaderAnimGate;
