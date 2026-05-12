'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { createContext, useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * FormFieldAnimationsSkipContext — when `true`, suppresses the per-field entry stagger.
 *
 * Set to `true` for forms rendered as outgoing snapshots (the previous slot in
 * `ModalScreenSwap`) so the fields are immediately at their final visible state
 * and the screen-level swap can translate the whole form intact, instead of the
 * fields running another entry stagger inside the leaving screen.
 */
export const FormFieldAnimationsSkipContext = createContext(false);

/**
 * FormFieldAnimations — GSAP fade-and-translate wrapper for individual form fields with per-field stagger.
 *
 * Mirrors the screen-level stagger used by `StaggerScreenAnimations` (cart / orders / favorites
 * cards): each field translates into place with a fade-in, and on close runs the same path in reverse
 * — later fields exit later because their own per-index delay shifts the reverse start.
 *
 * @param   {object}             props           - Component props.
 * @param   {ReactNode}          props.children  - Field markup to reveal.
 * @param   {string}             props.className - Wrapper class merged onto the animated container.
 * @param   {number}             props.index     - Field index used to compute the stagger delay.
 * @param   {'below' | 'above'}  [props.from]    - Direction the field enters from (`'below'` default — rises up; `'above'` — falls down). Used by `AuthProviderSelect` to make the logo + provider buttons fall from above for a top-down entry that matches the back-nav screen swap.
 * @returns JSX wrapper that animates the field into place with a fade.
 */
const FormFieldAnimations = ({
  children,
  className,
  index,
  from = 'below',
}: {
  children: ReactNode;
  className: string;
  index: number;
  from?: 'below' | 'above';
}): JSX.Element => {
  const { open, transition } = useContext(OpenDrawerContext);
  const skipEntry = useContext(FormFieldAnimationsSkipContext);
  const ref = useRef(null);

  useGSAP(() => {
    if (!ref.current) {
      return;
    }

    // Outgoing snapshot in a screen-swap: jump straight to the final state and
    // let the parent ModalScreenSwap translate the whole form away.
    if (skipEntry) {
      gsap.set(ref.current, { yPercent: 0, autoAlpha: 1 });
      return;
    }

    const startY = from === 'above' ? -100 : 100;

    const triggerTl = gsap.timeline({
      paused: true,
    });

    triggerTl.fromTo(
      ref.current,
      {
        yPercent: startY,
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
  }, [transition, open, skipEntry, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default FormFieldAnimations;
