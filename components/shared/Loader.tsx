'use client';

import type { JSX } from 'react';

import Spinner from './Spinner';

/** Loader — обёртка над `Spinner` с дефолтным размером блока загрузки. */
const Loader = (): JSX.Element => {
  return (
    <div className="relative aspect-square size-full max-h-62.5 overflow-hidden">
      <Spinner />
    </div>
  );
};

export default Loader;
