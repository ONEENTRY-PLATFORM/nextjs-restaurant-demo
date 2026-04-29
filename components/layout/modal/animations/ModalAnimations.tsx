'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Form modal animations — slide-up + backdrop blur, mirroring the cart /
 * filter drawer pattern. On `md+` the body is centered (CSS), so the slide-up
 * still reads as a card rising into view. The `component` prop is kept for
 * back-compat (was used to extend the close duration for `CalendarForm`).
 */
const ModalAnimations = ({
  children,
  component,
}: {
  children: ReactNode;
  component: string;
}): JSX.Element => {
  const { open, transition, setOpen, setTransition } =
    useContext(OpenDrawerContext);
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!ref.current || !open) {
      return;
    }
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

    const modalBg = ref.current.querySelector('#modalBg');
    const modalBody = ref.current.querySelector('#modalBody');

    // Calendar gets a punchier scale + blur + opacity entrance — feels
    // closer to a popup than the bottom-sheet slide-up used by auth forms.
    if (component === 'CalendarForm') {
      gsap.set(modalBg, { autoAlpha: 0, backdropFilter: 'blur(0px)' });
      gsap.set(modalBody, {
        autoAlpha: 0,
        scale: 0.85,
        filter: 'blur(8px)',
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
        },
        '-=0.3',
      );
    } else {
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
        '-=0.25',
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
