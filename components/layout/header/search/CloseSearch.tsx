/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSX } from 'react';

/**
 * Close search component
 */
const CloseSearch = ({ setState }: { setState: any }): JSX.Element => {
  return (
    <button
      className="absolute right-3 top-3 size-4"
      onClick={() => setState(false)}
      aria-label="Close search results"
    >
      &#10005;
    </button>
  );
};

export default CloseSearch;
