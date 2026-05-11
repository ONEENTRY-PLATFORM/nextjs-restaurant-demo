'use client';

import type { Dispatch, JSX, SetStateAction } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

/**
 * CloseSearch — close button for the search-results panel that flips the panel state to `false`.
 *
 * @param   {object}                              props          - Component props.
 * @param   {Dispatch<SetStateAction<boolean>>}   props.setState - Setter that owns the panel visibility.
 * @returns JSX of the close-X button.
 */
const CloseSearch = ({
  setState,
}: {
  setState: Dispatch<SetStateAction<boolean>>;
}): JSX.Element => {
  const t = useT();
  return (
    <button
      className="absolute right-3 top-3 size-4"
      onClick={() => setState(false)}
      aria-label={t('close_search_results_label', 'Close search results')}
    >
      &#10005;
    </button>
  );
};

export default CloseSearch;
