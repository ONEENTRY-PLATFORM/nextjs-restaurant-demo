import type { JSX } from 'react';

import Spinner from './Spinner';

/**
 * SpinnerLoader — wrapper around `Spinner` with a default loading-block size.
 *
 * @returns JSX of the spinner loader (square aspect with a centred spinner).
 */
const SpinnerLoader = (): JSX.Element => {
  return (
    <div className="relative aspect-square size-full max-h-62.5 overflow-hidden">
      <Spinner />
    </div>
  );
};

export default SpinnerLoader;
