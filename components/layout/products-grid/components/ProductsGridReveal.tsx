'use client';

import type { JSX, ReactNode } from 'react';
import { useEffect, useState } from 'react';

type Phase = 'show' | 'fading' | 'gone';

/**
 * Cross-fades a skeleton overlay into the actual grid contents.
 *
 * Bridges the gap between Suspense resolving (skeleton fallback unmounts)
 * and {@link CardAnimations} finishing its reveal — without it, viewers
 * see a brief empty state while cards are still hidden by their entry
 * `opacity:0`. Skeleton stays on top of the grid for a frame, then fades
 * out over `fadeMs` while cards animate in underneath.
 * @param   {object}      props          - Component props.
 * @param   {ReactNode}   props.children - Real grid content (already client-
 *                                         animated by `CardAnimations`).
 * @param   {ReactNode}   props.skeleton - Skeleton/loader to overlay.
 * @param   {number}      [props.holdMs] - Time before fade starts (covers
 *                                         the worst-case stagger delay of
 *                                         the first row reveal). Default 700.
 * @param   {number}      [props.fadeMs] - Cross-fade duration. Default 350.
 * @returns {JSX.Element}                Wrapper JSX.
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
