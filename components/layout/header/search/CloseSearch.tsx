import type { Dispatch, JSX, SetStateAction } from 'react';

/** Кнопка закрытия результатов поиска. */
const CloseSearch = ({
  setState,
}: {
  setState: Dispatch<SetStateAction<boolean>>;
}): JSX.Element => {
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
