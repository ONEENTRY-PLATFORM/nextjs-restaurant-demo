'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { JSX } from 'react';
import { useRef, useState } from 'react';

import type { AnimationsProps } from '@/app/types/global';

/**
 * Анимации обёртки корзины при stage leaving
 */
const CartAnimations = ({ children, className }: AnimationsProps): JSX.Element => {
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState<string>('');
  const ref = useRef(null);

  // Leave-анимация на route-transition. Bottom-to-top stagger — у корзины
  // кнопка APPLY внизу, и пользовательская модель «сначала уходит действие,
  // потом контент» читается естественнее, чем top-to-bottom. На остальных
  // страницах leave идёт сверху вниз (см. `OrdersAnimations`,
  // `CardsGridAnimations`). Entrance каждого элемента — в per-component
  // хуках (`ProductAnimations` / `TableRowAnimations`), здесь только leave.
  useGSAP(() => {
    if (stage !== 'leaving' || prevStage !== 'none') {
      setPrevStage(stage);
      return undefined;
    }
    const targets = gsap.utils.toArray<HTMLElement>(
      '.product-in-cart, .tr, #total, .cart-apply-btn'
    );
    if (targets.length === 0) {
      setPrevStage(stage);
      return undefined;
    }
    const tl = gsap.to(targets, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 0.4,
      stagger: { each: 0.07, from: 'end' },
    });
    setPrevStage(stage);
    return () => {
      tl.kill();
    };
  }, [stage]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default CartAnimations;
