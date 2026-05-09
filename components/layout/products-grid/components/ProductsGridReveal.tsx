'use client';

import type { JSX, ReactNode } from 'react';
import { useEffect, useState } from 'react';

type Phase = 'show' | 'fading' | 'gone';

/**
 * ProductsGridReveal — cross-fade оверлея скелетона в реальное содержимое грида.
 *
 * Закрывает разрыв между resolve Suspense (fallback скелетон размонтируется) и
 * завершением reveal-анимации в {@link CardAnimations} — без этого пользователи
 * видят короткое пустое состояние, пока карточки ещё скрыты их стартовым `opacity:0`.
 * @param   {object}      props          - Пропсы компонента.
 * @param   {ReactNode}   props.children - Настоящее содержимое грида.
 * @param   {ReactNode}   props.skeleton - Скелетон/лоадер для оверлея.
 * @param   {number}      [props.holdMs] - Время до старта fade. По умолчанию 700.
 * @param   {number}      [props.fadeMs] - Длительность cross-fade. По умолчанию 350.
 * @returns {JSX.Element}                JSX обёртки.
 */
const ProductsGridReveal = ({
  children,
  skeleton,
  holdMs = 700,
  fadeMs = 350,
}: {
  children: ReactNode;
  skeleton: ReactNode;
  holdMs?: number;
  fadeMs?: number;
}): JSX.Element => {
  const [phase, setPhase] = useState<Phase>('show');

  useEffect(() => {
    const startFade = window.setTimeout(() => setPhase('fading'), holdMs);
    const drop = window.setTimeout(() => setPhase('gone'), holdMs + fadeMs);
    return () => {
      window.clearTimeout(startFade);
      window.clearTimeout(drop);
    };
  }, [holdMs, fadeMs]);

  return (
    <div className="relative">
      {children}
      {phase !== 'gone' && (
        <div
          aria-hidden="true"
          className={
            'pointer-events-none absolute inset-0 z-10 transition-opacity ' +
            (phase === 'show' ? 'opacity-100' : 'opacity-0')
          }
          style={{ transitionDuration: `${fadeMs}ms` }}
        >
          {skeleton}
        </div>
      )}
    </div>
  );
};

export default ProductsGridReveal;
