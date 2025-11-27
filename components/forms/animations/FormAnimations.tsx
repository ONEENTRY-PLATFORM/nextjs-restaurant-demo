'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Form animations
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

  // Form transition animations
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
