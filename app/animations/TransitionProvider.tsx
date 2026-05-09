'use client';

import { gsap } from 'gsap';
import { usePathname } from 'next/navigation';
import { TransitionRouter } from 'next-transition-router';
import type { ReactNode } from 'react';
import { useRef } from 'react';

const LEAVE_DURATION = 0.28;
const ENTER_DURATION = 0.35;
const CARD_LEAVE_HOLD = 0.8;

function hasCardLeave(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/cart' ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname.startsWith('/promo/') ||
    pathname === '/profile/orders'
  );
}

/**
 * Transition provider — основной провайдер переходов 'stage'.
 */
export default function TransitionProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  return (
    <TransitionRouter
      auto={true}
      leave={next => {
        const el = ref.current;
        if (!el) {
          next();
          return;
        }
        const holdForCards = hasCardLeave(pathname) ? CARD_LEAVE_HOLD : 0;
        const tl = gsap
          .timeline()
          .to(el, {
            opacity: 0,
            y: -8,
            duration: LEAVE_DURATION,
            ease: 'power2.in',
            delay: holdForCards,
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
            }
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
