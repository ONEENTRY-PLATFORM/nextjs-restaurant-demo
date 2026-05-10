'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { RefObject } from 'react';
import { useState } from 'react';

import { PAYMENT_ROW_SELECTOR } from './constants';

/**
 * usePaymentStepAnimations — slide-up + fade reveal on mount and reverse on route leave for the payment step rows.
 *
 * `dependencies: []` on the mount timeline is intentional — without it, every state toggle (mode, accounts,
 * dropdown) would re-run the reveal on already-visible rows.
 *
 * @param   {RefObject<HTMLDivElement | null>} containerRef - Ref to the step container that holds the `.step-payment-row` children.
 * @returns Nothing.
 */
export const usePaymentStepAnimations = (containerRef: RefObject<HTMLDivElement | null>): void => {
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState<string>('');

  useGSAP(
    () => {
      if (!containerRef.current) return undefined;
      const targets = containerRef.current.querySelectorAll(PAYMENT_ROW_SELECTOR);
      if (targets.length === 0) return undefined;
      const tl = gsap.timeline();
      tl.set(targets, { autoAlpha: 0, yPercent: 100 }).to(targets, {
        autoAlpha: 1,
        yPercent: 0,
        duration: 0.4,
        stagger: 0.08,
      });
      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [] }
  );

  useGSAP(() => {
    const tl = gsap.timeline({ paused: true });

    if (stage === 'leaving' && prevStage === 'none' && containerRef.current) {
      const targets = containerRef.current.querySelectorAll(PAYMENT_ROW_SELECTOR);
      if (targets.length > 0) {
        tl.to(targets, {
          autoAlpha: 0,
          yPercent: 100,
          duration: 0.4,
          stagger: { each: 0.07, from: 'end' },
        });
        tl.play();
      }
    }

    setPrevStage(stage);

    return () => {
      tl.kill();
    };
  }, [stage]);
};
