'use client';

import type { JSX } from 'react';
import { ToastContainer } from 'react-toastify';

import { useIsMdUp } from '@/app/hooks/useIsMdUp';

/**
 * ResponsiveToastContainer — react-toastify container that flips to `top-right` below md.
 *
 * On mobile the bottom-menu sits at the bottom of the viewport (`md:hidden`, h-19),
 * so a `bottom-right` toast would overlap it. Above md we keep the desktop position.
 *
 * Server-snapshot is `true` (desktop) so SSR-rendered markup matches the most common
 * viewport; on mobile the first client render flips to `top-right`.
 *
 * @returns JSX of a single `<ToastContainer>` whose position adapts to the viewport.
 */
const ResponsiveToastContainer = (): JSX.Element => {
  const isMdUp = useIsMdUp(true);

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
