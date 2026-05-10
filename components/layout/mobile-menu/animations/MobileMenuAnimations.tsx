'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * MobileMenuAnimations — slide-from-left enter/leave animation for the mobile menu drawer.
 *
 * @param   {object}      props           - Component props.
 * @param   {ReactNode}   props.children  - Drawer content (must include `#modalBg` and `#modalBody`).
 * @param   {string}      props.className - Wrapper class merged onto the animated container.
 * @param   {string}      props.id        - DOM id assigned to the wrapper.
 * @returns {JSX.Element} JSX of the animated wrapper, or empty fragment when not open.
 */
const MobileMenuAnimations = ({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className: string;
  id: string;
}): JSX.Element => {
  const { open, transition, setOpen, setTransition } = useContext(OpenDrawerContext);
  const ref = useRef(null);

  useGSAP(() => {
    if (!open) {
      return;
    }
    const tl = gsap.timeline({
      paused: true,
    });

    if (transition === 'close') {
      tl.to('#modalBg, #modalBody', {
        xPercent: -150,
        autoAlpha: 0,
        onComplete: () => {
          setTransition('');
          setOpen(false);
        },
      }).play();
    } else if (open) {
      tl.set('#modalBg, #modalBody', {
        xPercent: -150,
        autoAlpha: 0,
      })
        .to('#modalBg', {
          xPercent: 0,
          autoAlpha: 1,
        })
        .to('#modalBody', {
          xPercent: 0,
          autoAlpha: 1,
        })
        .to('#modalBg', {
          backdropFilter: 'blur(10px)',
        })
        .play();
    }

    return () => {
      tl.kill();
    };
  }, [open, transition]);

  if (!open) {
    return <></>;
  }

  return (
    <div ref={ref} id={id} className={className}>
      {children}
    </div>
  );
};

export default MobileMenuAnimations;
