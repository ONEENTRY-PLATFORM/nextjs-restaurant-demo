'use client';

import 'react-toastify/dist/ReactToastify.css';

import type { JSX } from 'react';
import { ToastContainer } from 'react-toastify';

import { useIsMdUp } from '@/app/hooks/useIsMdUp';

/**
 * LazyToastContainer — concrete `<ToastContainer>` lifted into its own module
 * so `react-toastify` (lib + CSS) lives in a single dynamic chunk and stays
 * out of the layout's critical path. Mount is gated by
 * {@link ResponsiveToastContainer}.
 *
 * @returns JSX of a `<ToastContainer>` whose position adapts to the viewport.
 */
const LazyToastContainer = (): JSX.Element => {
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

export default LazyToastContainer;
