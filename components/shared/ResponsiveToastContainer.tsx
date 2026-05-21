'use client';

import dynamic from 'next/dynamic';
import { type JSX, useEffect, useState } from 'react';

// `react-toastify` (lib + CSS) is ~40 KB but no toast fires on initial page
// load — every entry point is user-triggered (login, add to cart, …). Defer
// the import past first paint via `requestIdleCallback` so the chunk stops
// blocking the critical path. CSS lives inside `LazyToastContainer` as a
// static import so it travels with the lazy chunk (Turbopack rejects dynamic
// `import()` of `.css` files).
const LazyToastContainer = dynamic(() => import('./LazyToastContainer'), { ssr: false });

/**
 * ResponsiveToastContainer — defers mounting the toast container until the
 * browser is idle (or after a 1.5 s fallback) so `react-toastify` is not part
 * of the layout's initial chunk.
 *
 * @returns The lazily-mounted toast container, or `null` while deferred.
 */
const ResponsiveToastContainer = (): JSX.Element | null => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return;
    }
    const id = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) return null;
  return <LazyToastContainer />;
};

export default ResponsiveToastContainer;
