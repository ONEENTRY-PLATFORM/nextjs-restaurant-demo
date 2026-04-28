'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Favorites popup open/close animations — mirrors `CartPopupAnimations`.
 * Backdrop fades in, body slides up from the bottom (mobile) /
 * in from the right (md+).
 * @param   {object}      props          - Component props.
 * @param   {ReactNode}   props.children - Drawer content.
 * @returns {JSX.Element}                Animation wrapper JSX.
 */
const FavoritesPopupAnimations = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const { open, component, transition, setOpen, setTransition } =
    useContext(OpenDrawerContext);
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!open || component !== 'FavoritesPopup') {
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

    const modalBg = ref.current?.querySelector('#modalBg') ?? null;
    const modalBody = ref.current?.querySelector('#modalBody') ?? null;

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

    if (transition === 'close') {
      tl.reverse(2);
    } else {
      tl.play();
    }

    return () => {
      tl.kill();
    };
  }, [open, transition]);

  if (!open || component !== 'FavoritesPopup') {
    return <></>;
  }

  return (
    <div ref={ref} className="fixed inset-0 z-50 flex h-screen w-full">
      {children}
    </div>
  );
};

export default FavoritesPopupAnimations;
