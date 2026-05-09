'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { JSX, ReactNode } from 'react';
import { useRef, useState } from 'react';

const ORDERS_ROW_SELECTOR = '.orders-row';

/**
 * OrdersAnimations — entrance/leave stagger для `.orders-row` на `/profile/orders`.
 *
 * @param   {object}    props          - Пропсы.
 * @param   {ReactNode} props.children - Контент OrdersList (включая sidebar).
 * @param   {number}    props.rowsKey  - Сигнал ре-маунта entrance-таймлайна.
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
