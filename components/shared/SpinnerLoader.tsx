'use client';

import type { JSX } from 'react';

import Spinner from './Spinner';

/**
 * Loader for spinner
 */
const SpinnerLoader = (): JSX.Element => {
  return (
    <div className="relative aspect-square size-full max-h-62.5 overflow-hidden">
      <Spinner />
    </div>
  );
};

export default SpinnerLoader;
