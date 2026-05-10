'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * FormAnimations — GSAP fade animation wrapper for auth-popup forms tied to {@link OpenDrawerContext}.
 *
 * @param   {object}    props           - Component props.
 * @param   {ReactNode} props.children  - Form content to animate in/out.
 * @param   {boolean}   props.isLoading - When `true`, suppresses animation until the form schema is loaded.
 * @param   {string}    props.className - Wrapper class merged onto the animated container.
 * @param   {boolean}   props.isActive  - Whether this form is the active step in the auth wizard.
 * @returns {JSX.Element}                 JSX wrapper that reveals/hides children with a GSAP fade.
 */
const FormAnimations = ({
  children,
  isLoading,
  className,
  isActive,
}: {
  children: ReactNode;
  isLoading: boolean;
  className: string;
  isActive: boolean;
}): JSX.Element => {
  const { open, transition, setTransition } = useContext(OpenDrawerContext);
  const ref = useRef(null);

  useGSAP(() => {
    if (!open || !ref.current || isLoading || !isActive) {
      return;
    }
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        setTransition('');
      },
      onReverseComplete: () => {
        setTransition('');
      },
    });

    tl.from(ref.current, {
      autoAlpha: 0,
    }).to(ref.current, {
      autoAlpha: 1,
    });

    if (transition === 'close') {
      tl.reverse(0.5);
    } else {
      tl.play();
    }

    return () => {
      tl.kill();
    };
  }, [transition, open, isLoading]);

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
};

export default FormAnimations;
