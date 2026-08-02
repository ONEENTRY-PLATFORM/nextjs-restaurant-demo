'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * useNearViewport — sticky IntersectionObserver gate.
 *
 * Returns `false` until the observed element gets within `rootMargin` of the
 * viewport, then flips to `true` permanently (the observer disconnects on the
 * first hit, so the flag never goes back to `false`).
 *
 * Use it to defer any side-effect that is wasted off-screen — most notably
 * Next.js `<Image>` mounts, which fire an `/image?url=…` optimizer request
 * the moment the element renders, even when `loading="lazy"` is set.
 *
 * When `IntersectionObserver` is missing (SSR, ancient browsers), the hook
 * returns `true` on first effect tick so behavior degrades to eager.
 *
 * @param   {RefObject<Element | null>} ref        - Ref to the element being observed.
 * @param   {object}                    [opts]     - Observer tuning.
 * @param   {string}                    [opts.rootMargin] - IntersectionObserver `rootMargin` (default `'200px'`).
 * @returns `true` once the element has come within `rootMargin` of the viewport.
 */
export const useNearViewport = (
  ref: RefObject<Element | null>,
  { rootMargin = '200px' }: { rootMargin?: string } = {}
): boolean => {
  // No IntersectionObserver (legacy browsers/jsdom) — degrade to "visible"
  // straight from the initializer instead of a setState inside the effect
  // body. The server branch stays `false` so SSR matches the hydrated state.
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, visible]);

  return visible;
};
