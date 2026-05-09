'use client';

import type { JSX, ReactNode } from 'react';
import { useEffect, useState } from 'react';

type Phase = 'show' | 'fading' | 'gone';

/**
 * ProductsGridReveal — cross-fades the skeleton overlay into the real grid content.
 *
 * Bridges the gap between Suspense resolution (when the fallback skeleton unmounts) and
 * the completion of the reveal animation in {@link CardAnimations} — without this, users
 * see a brief empty state while cards are still hidden by their initial `opacity:0`.
 * @param   {object}      props          - Component props.
 * @param   {ReactNode}   props.children - The real grid content.
 * @param   {ReactNode}   props.skeleton - Skeleton/loader for the overlay.
 * @param   {number}      [props.holdMs] - Time before fade starts. Defaults to 700.
 * @param   {number}      [props.fadeMs] - Cross-fade duration. Defaults to 350.
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
