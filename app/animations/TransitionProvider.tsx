'use client';

import { gsap } from 'gsap';
import { usePathname } from 'next/navigation';
import { TransitionRouter } from 'next-transition-router';
import type { ReactNode } from 'react';
import { useRef } from 'react';

const LEAVE_DURATION = 0.28;
const ENTER_DURATION = 0.35;
const CARD_LEAVE_HOLD = 0.8;
const SCROLL_TO_TOP_DURATION = 0.45;
const SCROLL_TO_TOP_MIN_PX = 8;

/**
 * hasCardLeave — checks whether the current pathname needs the extended card-leave hold before navigating.
 *
 * @param   {string}  pathname - Current `next/navigation` pathname.
 * @returns `true` for routes that render product/order cards needing the longer leave hold.
 */
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
 * TransitionProvider — wraps the app with a `next-transition-router` so route changes
 * play a GSAP-driven stage transition on the wrapped element.
 *
 * @param   {object}      props          - Component props.
 * @param   {ReactNode}   props.children - Tree rendered inside the transition stage.
 * @returns JSX of the transition root.
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
        const currentScroll =
          typeof window === 'undefined'
            ? 0
            : window.scrollY || window.pageYOffset || 0;
        const needsScroll = currentScroll > SCROLL_TO_TOP_MIN_PX;
        const tl = gsap.timeline();
        if (needsScroll) {
          tl.to(window, {
            scrollTo: { y: 0, autoKill: false },
            duration: SCROLL_TO_TOP_DURATION,
            ease: 'power2.inOut',
          });
        }
        tl.to(el, {
          opacity: 0,
          y: -8,
          duration: LEAVE_DURATION,
          ease: 'power2.in',
          delay: holdForCards,
        }).call(next);
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
