'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { JSX, ReactNode } from 'react';
import { useRef, useState } from 'react';

/** ReviewAnimations — toggle/leaving animation for the review block. */
const ReviewAnimations = ({
  children,
  className,
  index,
  state,
}: {
  children: ReactNode;
  className: string;
  index: number;
  state: boolean;
}): JSX.Element => {
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState('');
  const ref = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      paused: true,
    });
    tl.fromTo(
      ref.current,
      {
        autoAlpha: 0,
        height: 0,
        yPercent: -100,
      },
      {
        autoAlpha: 1,
        height: 'auto',
        yPercent: 0,
        duration: 0.35,
        delay: index / 10,
      }
    );

    if (!state) {
      tl.reverse(0.75);
    } else {
      tl.play();
    }

    return () => {
      tl.kill();
    };
  }, [state]);

  useGSAP(() => {
    const tl = gsap.timeline();

    if (stage === 'leaving' && prevStage === 'none' && state) {
      tl.to(ref.current, {
        height: 0,
        autoAlpha: 0,
        yPercent: -100,
        duration: 0.5,
        delay: index / 10,
      });
      tl.play();
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

export default ReviewAnimations;
