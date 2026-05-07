'use client';

import { gsap } from 'gsap';
import { TransitionRouter } from 'next-transition-router';
import type { ReactNode } from 'react';
import { useRef } from 'react';

const LEAVE_DURATION = 0.28;
const ENTER_DURATION = 0.35;

/**
 * Transition provider — основной провайдер переходов 'stage'.
 * Лист уходит фейдом + лёгким lift-up, затем сразу скроллится вверх (уже
 * невидимым), новый — вплывает снизу. Без этого navigation-свапа выглядит
 * как «прыжок наверх и резкая смена».
 */
export default function TransitionProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <TransitionRouter
      auto={true}
      leave={next => {
        const el = ref.current;
        if (!el) {
          next();
          return;
        }
        const tl = gsap
          .timeline()
          .to(el, {
            opacity: 0,
            y: -8,
            duration: LEAVE_DURATION,
            ease: 'power2.in',
          })
          .set(window, { scrollTo: 0 })
          .call(next);
        return () => {
          tl.kill();
        };
      }}
      enter={next => {
        const el = ref.current;
        if (!el) {
          next();
          return;
        }
        const tl = gsap
          .timeline()
          .fromTo(
            el,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: ENTER_DURATION,
              ease: 'power2.out',
            },
          )
          .call(next);
        return () => {
          tl.kill();
        };
      }}
    >
      <div ref={ref} className="relative flex flex-col grow justify-between">
        {children}
      </div>
    </TransitionRouter>
  );
}
