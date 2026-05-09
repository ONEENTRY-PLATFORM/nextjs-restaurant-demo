'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { JSX, ReactNode } from 'react';
import { useRef, useState } from 'react';

const ORDERS_ROW_SELECTOR = '.orders-row';

/**
 * Анимации для `/profile/orders`. Аналог `StepOrder` / `CartAnimations`:
 * entrance — stagger slide-up + fade на маунте и при изменении количества
 * строк (когда заказы дохдят async из API), leave — обратная stagger-анимация
 * на стадии 'leaving' от `next-transition-router`. Целится в `.orders-row`
 * — этот класс ставится на заголовки секций ("Active orders" / "Orders
 * History"), карточки заказов и баннеры промо-сайдбара.
 *
 * @param   {object}      props           - Пропсы.
 * @param   {ReactNode}   props.children  - Контент (вся OrdersList включая sidebar).
 * @param   {number}      props.rowsKey   - Сигнал ре-маунта entrance-таймлайна
 *                                          (например, `active.length + history.length`).
 * @returns {JSX.Element}                 JSX обёртки с ref.
 */
const OrdersAnimations = ({
  children,
  rowsKey,
}: {
  children: ReactNode;
  rowsKey: number;
}): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState<string>('');

  useGSAP(
    () => {
      if (!containerRef.current) return undefined;
      const targets = containerRef.current.querySelectorAll(ORDERS_ROW_SELECTOR);
      if (targets.length === 0) return undefined;
      const tl = gsap.timeline();
      tl.set(targets, { autoAlpha: 0, yPercent: 100 }).to(targets, {
        autoAlpha: 1,
        yPercent: 0,
        duration: 0.4,
        stagger: 0.08,
      });
      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [rowsKey] }
  );

  useGSAP(() => {
    const tl = gsap.timeline({ paused: true });

    if (stage === 'leaving' && prevStage === 'none' && containerRef.current) {
      const targets = containerRef.current.querySelectorAll(ORDERS_ROW_SELECTOR);
      if (targets.length > 0) {
        tl.to(targets, {
          autoAlpha: 0,
          yPercent: 100,
          duration: 0.4,
          stagger: { each: 0.07, from: 'end' },
        });
        tl.play();
      }
    }

    setPrevStage(stage);

    return () => {
      tl.kill();
    };
  }, [stage]);

  return <div ref={containerRef}>{children}</div>;
};

export default OrdersAnimations;
