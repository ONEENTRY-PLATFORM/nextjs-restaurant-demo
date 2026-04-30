'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Анимации формы модалки — slide-up + backdrop blur, зеркалят паттерн drawer
 * для корзины / фильтра. На `md+` тело центрируется (CSS), поэтому slide-up
 * читается как карточка, поднимающаяся в видимую область. Пропс `component`
 * сохранён для обратной совместимости (использовался, чтобы увеличить
 * длительность закрытия для `CalendarForm`).
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

    // У календаря более резкий entrance со scale + blur + opacity — ощущается
    // ближе к попапу, чем bottom-sheet slide-up, используемый формами auth.
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
