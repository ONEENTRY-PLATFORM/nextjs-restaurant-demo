'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Анимации открытия/закрытия попапа поддержки — slide-up снизу + fade-in
 * затемнённого `ModalBackdrop`-а (как в `FavoritesPopupAnimations` /
 * `CartPopupAnimations`). Mobile-only, sheet с верхними скруглениями
 * по образцу `static-html/m_support.html`.
 * @param   {object}      props          - Пропсы компонента.
 * @param   {ReactNode}   props.children - Содержимое попапа (modalBg + modalBody).
 * @returns {JSX.Element}                JSX обёртки анимации.
 */
const SupportPopupAnimations = ({ children }: { children: ReactNode }): JSX.Element => {
  const { open, component, transition, setOpen, setTransition } = useContext(OpenDrawerContext);
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!open || component !== 'SupportPopup') {
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
    }).to(modalBody, { yPercent: 0, duration: 0.5, ease: 'power2.out' }, '-=0.25');

    if (transition === 'close') {
      tl.reverse(2);
    } else {
      tl.play();
    }

    return () => {
      tl.kill();
    };
  }, [open, transition]);

  if (!open || component !== 'SupportPopup') {
    return <></>;
  }

  return (
    <div ref={ref} className="z-500 fixed inset-0 md:hidden">
      {children}
    </div>
  );
};

export default SupportPopupAnimations;
