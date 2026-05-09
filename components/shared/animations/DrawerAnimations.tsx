'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Варианты анимации появления попапа:
 * - `bottom-sheet` — мобила: slide-up; десктоп: scale + fade (центрированные попапы).
 * - `slide-up`     — `yPercent: 100 → 0` всегда (Cart, Profile — якорятся через top/right).
 * - `slide-right`  — `xPercent: 100 → 0` всегда (Filter).
 */
export type DrawerAnimationVariant = 'bottom-sheet' | 'slide-up' | 'slide-right';

/**
 * DrawerAnimations — универсальная GSAP-обёртка для попапов через {@link OpenDrawerContext}.
 * Дети должны содержать элементы с id `modalBg` (backdrop) и `modalBody` (тело).
 * Закрытие триггерится `setTransition('close')` — таймлайн играется в реверсе.
 */
const DrawerAnimations = ({
  children,
  component: matchComponent,
  variant = 'bottom-sheet',
  wrapperClassName,
}: {
  children: ReactNode;
  component: string;
  variant?: DrawerAnimationVariant;
  /** Дополнительные классы на root-обёртку (например, `md:hidden` для мобильно-специфичных попапов). */
  wrapperClassName?: string;
}): JSX.Element => {
  const { open, component, transition, setOpen, setTransition } = useContext(OpenDrawerContext);
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!open || component !== matchComponent) {
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

    // На мобиле всегда slide-up снизу — единая идиома bottom-меню; на md+ зависит от варианта.
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    gsap.set(modalBg, { autoAlpha: 0 });
    if (variant === 'slide-right') {
      gsap.set(modalBody, { xPercent: 100 });
    } else if (variant === 'slide-up') {
      gsap.set(modalBody, { yPercent: 100 });
    } else if (isMobile) {
      gsap.set(modalBody, { yPercent: 100 });
    } else {
      gsap.set(modalBody, { autoAlpha: 0, scale: 0.85 });
    }

    tl.to(modalBg, {
      autoAlpha: 1,
      backdropFilter: 'blur(10px)',
      duration: 0.5,
    });

    if (variant === 'slide-right') {
      tl.to(modalBody, { autoAlpha: 1, xPercent: 0, duration: 0.5 }, '-=0.25');
    } else if (variant === 'slide-up' || isMobile) {
      tl.to(modalBody, { autoAlpha: 1, yPercent: 0, duration: 0.5 }, '-=0.25');
    } else {
      tl.to(modalBody, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }, '-=0.25');
    }

    if (transition === 'close') {
      tl.reverse(2);
    } else {
      tl.play();
    }

    return () => {
      tl.kill();
    };
  }, [open, transition]);

  if (!open || component !== matchComponent) {
    return <></>;
  }

  return (
    <div
      ref={ref}
      className={
        'z-500 fixed inset-0 flex h-screen w-full' +
        (wrapperClassName ? ' ' + wrapperClassName : '')
      }
    >
      {children}
    </div>
  );
};

export default DrawerAnimations;
