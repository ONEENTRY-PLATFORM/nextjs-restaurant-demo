'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * FormFieldAnimations — GSAP width-reveal wrapper for individual form fields with per-field stagger.
 *
 * @param   {object}    props           - Component props.
 * @param   {ReactNode} props.children  - Field markup to reveal.
 * @param   {string}    props.className - Wrapper class merged onto the animated container.
 * @param   {number}    props.index     - Field index used to compute the stagger delay.
 * @returns {JSX.Element}                 JSX wrapper that animates the field width from 0 → 100%.
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

    gsap.set(ref.current, {
      transformOrigin: '0 0',
      overflow: 'hidden',
    });

    const triggerTl = gsap.timeline({
      paused: true,
    });

    triggerTl.fromTo(
      ref.current,
      {
        width: 0,
        opacity: 0,
      },
      {
        width: '100%',
        opacity: 1,
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
