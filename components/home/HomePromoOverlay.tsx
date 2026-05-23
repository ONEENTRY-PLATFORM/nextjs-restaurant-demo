'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import {
  isHeaderAnimationComplete,
  subscribeHeaderAnimation,
} from '@/app/animations/headerAnimState';

/**
 * HomePromoOverlay — solid-black overlay positioned absolutely over the HomePromo banners.
 *
 * Stays at the default `opacity: 1` (covering the hero) until the header GSAP timeline reports completion via `markHeaderAnimationComplete`; the client effect then flips a flag that adds the `home-promo-overlay` class, triggering the CSS `home-promo-overlay-fade` keyframes (0.5 s delay + 0.5 s duration → fully transparent ~1 s after the header sequence ends).
 *
 * The hero `<img>` underneath never animates opacity, so Chrome's LCP heuristic still picks it up at the first paint — Chrome ignores occlusion by sibling elements when computing LCP candidacy, so the overlay-fade looks like a fade-in without taxing the metric.
 *
 * Honors `prefers-reduced-motion` via Tailwind's `motion-reduce:hidden`, so users with reduced motion never see the overlay at all.
 *
 * @returns JSX overlay element sitting inside the HomePromo wrapper.
 */
const HomePromoOverlay = (): JSX.Element => {
  const [fading, setFading] = useState<boolean>(false);

  useEffect(() => {
    if (isHeaderAnimationComplete()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFading(true);
      return undefined;
    }
    const unsubscribe = subscribeHeaderAnimation(() => setFading(true));
    return unsubscribe;
  }, []);

  return (
    <div
      aria-hidden="true"
      className={
        'pointer-events-none absolute inset-0 z-10 bg-black motion-reduce:hidden' +
        (fading ? ' home-promo-overlay' : '')
      }
    />
  );
};

export default HomePromoOverlay;
