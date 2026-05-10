'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * ModalAnimations — modal animations: slide-up on mobile, centered fade+scale on md+, special scale+blur for CalendarForm.
 *
 * @param   {object}      props           - Component props.
 * @param   {ReactNode}   props.children  - Modal content (must include `#modalBg` and `#modalBody`).
 * @param   {string}      props.component - Active component identifier (used to pick the right entrance variant).
 * @returns JSX wrapper that drives the entrance/leave timeline, or empty fragment when not open.
 */
const ModalAnimations = ({
  children,
  component,
}: {
  children: ReactNode;
  component: string;
}): JSX.Element => {
  const { open, transition, setOpen, setTransition } = useContext(OpenDrawerContext);
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!ref.current || !open) {
      return;
    }

    const modalBg = ref.current.querySelector('#modalBg');
    const modalBody = ref.current.querySelector('#modalBody');

    // The GSAP transform overrides the CSS `md:-translate-x/y-1/2`, so on desktop
    // we set centering via `xPercent/yPercent` inside the timeline.
    const isDesktop =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        setTransition('');
      },
      onReverseComplete: () => {
        setOpen(false);
        setTransition('');
      },
    });

    // Calendar — snappy entrance scale + blur + opacity instead of slide-up.
    if (component === 'CalendarForm') {
      gsap.set(modalBg, { autoAlpha: 0, backdropFilter: 'blur(0px)' });
      gsap.set(modalBody, {
        autoAlpha: 0,
        scale: 0.85,
        filter: 'blur(8px)',
        ...(isDesktop ? { xPercent: -50, yPercent: -50 } : {}),
      });

      tl.to(modalBg, {
        autoAlpha: 1,
        backdropFilter: 'blur(10px)',
        duration: 0.45,
        ease: 'power2.out',
      }).to(
        modalBody,
        {
          autoAlpha: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.55,
          ease: 'back.out(1.4)',
          ...(isDesktop ? { xPercent: -50, yPercent: -50 } : {}),
        },
        '-=0.3'
      );
    } else if (isDesktop) {
      // Desktop: fade + a slight scale with a -50%/-50% offset for centering.
      gsap.set(modalBg, { autoAlpha: 0 });
      gsap.set(modalBody, {
        autoAlpha: 0,
        scale: 0.95,
        xPercent: -50,
        yPercent: -50,
      });

      tl.to(modalBg, {
        autoAlpha: 1,
        backdropFilter: 'blur(10px)',
        duration: 0.5,
      }).to(
        modalBody,
        {
          autoAlpha: 1,
          scale: 1,
          xPercent: -50,
          yPercent: -50,
          duration: 0.45,
          ease: 'power2.out',
        },
        '-=0.3'
      );
    } else {
      // Mobile: bottom-sheet slide-up.
      gsap.set(modalBg, { autoAlpha: 0 });
      gsap.set(modalBody, { yPercent: 100 });

      tl.to(modalBg, {
        autoAlpha: 1,
        backdropFilter: 'blur(10px)',
        duration: 0.5,
      }).to(
        modalBody,
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.5,
        },
        '-=0.25'
      );
    }

    if (transition === 'close') {
      tl.reverse(component === 'CalendarForm' ? 1.4 : 2);
    } else {
      tl.play();
    }

    return () => {
      tl.kill();
    };
  }, [open, transition]);

  if (!open) {
    return <></>;
  }

  return (
    <div ref={ref} className="z-500 fixed inset-0 flex h-screen w-full">
      {children}
    </div>
  );
};

export default ModalAnimations;
