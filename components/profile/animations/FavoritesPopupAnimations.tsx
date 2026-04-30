'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Анимации открытия/закрытия попапа избранного — появление модалки по центру
 * (scale + blur + opacity), повторяет паттерн модалки `CalendarForm`.
 * @param   {object}      props          - Пропсы компонента.
 * @param   {ReactNode}   props.children - Содержимое попапа.
 * @returns {JSX.Element}                JSX обёртки анимации.
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

    if (transition === 'close') {
      tl.reverse(1.4);
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
