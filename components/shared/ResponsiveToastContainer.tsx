'use client';

import type { JSX } from 'react';
import { ToastContainer } from 'react-toastify';

import { useIsMdUp } from '@/app/hooks/useIsMdUp';

/**
 * ResponsiveToastContainer — react-toastify container that flips to `top-right` below md.
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
