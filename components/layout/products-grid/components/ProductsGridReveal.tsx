'use client';

import type { JSX, ReactNode } from 'react';
import { useEffect, useState } from 'react';

type Phase = 'show' | 'fading' | 'gone';

/**
 * ProductsGridReveal — cross-fades the skeleton overlay into the real grid content.
 *
 * @param   {object}      props            - Component props.
 * @param   {ReactNode}   props.children   - The real grid content underneath the overlay.
 * @param   {ReactNode}   props.skeleton   - Skeleton/loader rendered as the overlay.
 * @param   {number}      [props.holdMs]   - Time before the fade starts (defaults to 40).
 * @param   {number}      [props.fadeMs]   - Cross-fade duration (defaults to 500).
 * @returns {JSX.Element} JSX wrapper that orchestrates the overlay opacity transition.
 */
const ProductsGridReveal = ({
  children,
  skeleton,
  holdMs = 40,
  fadeMs = 500,
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
    <div className="relative w-full">
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
