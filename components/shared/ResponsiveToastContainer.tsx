'use client';

import type { JSX } from 'react';
import { useSyncExternalStore } from 'react';
import { ToastContainer } from 'react-toastify';

const MD_QUERY = '(min-width: 768px)';
const subscribeMd = (cb: () => void): (() => void) => {
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getMdSnapshot = (): boolean => window.matchMedia(MD_QUERY).matches;
// Assume desktop on the server so SSR-rendered markup matches the most common viewport;
// on mobile the first client render swaps to top-right.
const getMdServerSnapshot = (): boolean => true;

/**
 * ResponsiveToastContainer — react-toastify container that flips to `top-right` below md.
 *
 * On mobile the bottom-menu sits at the bottom of the viewport (`md:hidden`, h-19),
 * so a `bottom-right` toast would overlap it. Above md we keep the desktop position.
 *
 * @returns JSX of a single `<ToastContainer>` whose position adapts to the viewport.
 */
const ResponsiveToastContainer = (): JSX.Element => {
  const isMdUp = useSyncExternalStore(subscribeMd, getMdSnapshot, getMdServerSnapshot);

  return (
    <ToastContainer
      position={isMdUp ? 'bottom-right' : 'top-right'}
      autoClose={2000}
      theme="dark"
      pauseOnFocusLoss={false}
    />
  );
};

export default ResponsiveToastContainer;
