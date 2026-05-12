'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * FormFieldAnimations — GSAP fade-and-rise wrapper for individual form fields with per-field stagger.
 *
 * Mirrors the screen-level stagger used by `StaggerScreenAnimations` (cart / orders / favorites
 * cards): each field rises from below with a fade-in, and on close runs the same path in reverse
 * — later fields exit later because their own per-index delay shifts the reverse start.
 *
 * @param   {object}    props           - Component props.
 * @param   {ReactNode} props.children  - Field markup to reveal.
 * @param   {string}    props.className - Wrapper class merged onto the animated container.
 * @param   {number}    props.index     - Field index used to compute the stagger delay.
 * @returns JSX wrapper that animates the field upward from below with a fade.
 */
const FormFieldAnimations = ({
  children,
  className,
  index,
}: {
  children: ReactNode;
  className: string;
  index: number;
}): JSX.Element => {
  const { open, transition } = useContext(OpenDrawerContext);
  const ref = useRef(null);

  useGSAP(() => {
    if (!ref.current) {
      return;
    }

    const triggerTl = gsap.timeline({
      paused: true,
    });

    triggerTl.fromTo(
      ref.current,
      {
        yPercent: 100,
        autoAlpha: 0,
      },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.4,
        delay: index / 10 + 0.35,
      }
    );

    if (transition === 'close') {
      triggerTl.reverse(index / 10 + 0.65);
    } else {
      triggerTl.play();
    }

    return () => {
      triggerTl.kill();
    };
  }, [transition, open]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default FormFieldAnimations;
