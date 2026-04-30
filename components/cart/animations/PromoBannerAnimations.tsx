'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

/**
 * Stagger fade-in для промо-сайдбара корзины / заказов — зеркалит
 * эффект первой загрузки `ProductAnimations` на товарах корзины, чтобы
 * баннеры сайдбара выезжали вместе со списком товаров.
 *
 * @param   {object}   props           - Пропсы компонента.
 * @param   {ReactNode} props.children - Элемент баннера для анимации.
 * @param   {number}   props.index     - Позиция в списке (управляет задержкой stagger).
 * @param   {string}   [props.className] - Класс обёртки.
 * @returns {JSX.Element}              JSX обёрнутого баннера.
 */
const PromoBannerAnimations = ({
  children,
  index,
  className,
}: {
  children: ReactNode;
  index: number;
  className?: string;
}): JSX.Element => {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const tl = gsap.timeline({ paused: true });
    tl.set(ref.current, { opacity: 0, yPercent: 100 }).to(ref.current, {
      opacity: 1,
      yPercent: 0,
      delay: index / 10,
    });
    tl.play();
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default PromoBannerAnimations;
