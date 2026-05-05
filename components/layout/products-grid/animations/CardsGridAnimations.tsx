'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { JSX, ReactNode } from 'react';
import { useRef, useState } from 'react';

/**
 * Компонент анимаций CardsGrid
 */
const CardsGridAnimations = ({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}): JSX.Element => {
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState('');
  const ref = useRef(null);

  // анимации leaving
  useGSAP(() => {
    const tl = gsap.timeline({
      paused: true,
    });

    if (stage === 'leaving' && prevStage === 'none') {
      const cards = ref.current && (ref.current as HTMLDivElement).querySelectorAll('.in-view');

      tl.to(cards, {
        autoAlpha: 0,
        scale: 0,
        duration: 0.45,
        stagger: 0.05,
      }).to(ref.current, {
        autoAlpha: 0,
        duration: 0.35,
      });
      tl.play();
    }

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

export default CardsGridAnimations;
