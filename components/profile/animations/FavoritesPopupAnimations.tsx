'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Анимации открытия/закрытия попапа избранного — slide-up снизу как в
 * `CartPopupAnimations`, чтобы все drawer-ы из bottom-меню имели единую
 * идиому появления.
 * @param   {object}      props          - Пропсы компонента.
 * @param   {ReactNode}   props.children - Содержимое попапа.
 * @returns {JSX.Element}                JSX обёртки анимации.
 */
const FavoritesPopupAnimations = ({ children }: { children: ReactNode }): JSX.Element => {
  const { open, component, transition, setOpen, setTransition } = useContext(OpenDrawerContext);
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

    // На мобиле — slide-up снизу (паттерн bottom-меню как у `CartPopup`).
    // На md+ попап центрирован через `translate-x/y-1/2`, и `yPercent`
    // конфликтует с центрированием — там оставляем scale + fade.
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    gsap.set(modalBg, { autoAlpha: 0 });
    if (isMobile) {
      gsap.set(modalBody, { yPercent: 100 });
    } else {
      gsap.set(modalBody, { autoAlpha: 0, scale: 0.85 });
    }

    tl.to(modalBg, {
      autoAlpha: 1,
      backdropFilter: 'blur(10px)',
      duration: 0.5,
    }).to(
      modalBody,
      isMobile
        ? { autoAlpha: 1, yPercent: 0, duration: 0.5 }
        : { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' },
      '-=0.25'
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
    <div ref={ref} className="z-500 fixed inset-0 flex h-screen w-full">
      {children}
    </div>
  );
};

export default FavoritesPopupAnimations;
