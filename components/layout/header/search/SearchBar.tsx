'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent, JSX } from 'react';
import { Suspense, useState } from 'react';
import { useDebounce } from 'use-debounce';

import SearchIcon from '@/components/icons/search';

import SearchResults from './SearchResults';

/**
 * SearchBar — header search input with debounced query and a results dropdown.
 *
 * The query is held in local state and is intentionally NOT written to the URL —
 * pushing `?search=` into the current pathname caused server components on the
 * home page to refetch and filter their grids by the header input.
 *
 * Pressing Enter (or clicking the magnifier inside the dropdown) navigates to
 * `/shop?search=<query>`, where the catalog page reads the param and filters.
 *
 * @param   {object}      props             - Component props.
 * @param   {string}      props.placeholder - Placeholder/aria-label for the input.
 * @returns JSX of the search input with suspended results panel.
 */
const SearchBar = ({ placeholder }: { placeholder: string }): JSX.Element => {
  const router = useRouter();

  const [inputValue, setInputValue] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [debouncedValue] = useDebounce(inputValue, 300);

  const handleChange = (term: string) => {
    setInputValue(term);
    setIsSearchActive(term.length > 0);
  };

  const goToShopWithQuery = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setIsSearchActive(false);
    const params = new URLSearchParams({ search: trimmed });
    router.push(`/shop?${params.toString()}`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    goToShopWithQuery(inputValue);
  };

  return (
    <div className="relative grow">
      <form className="relative" onSubmit={handleSubmit}>
        <input
          value={inputValue}
          onChange={e => handleChange(e.target.value)}
          type="search"
          id="searchInput"
          name="quick-search"
          className="rounded w-full md:w-62.5 lg:w-83.75 h-9.5 backdrop-blur-card bg-[rgba(106,108,122,0.5)] pl-10 text-paper cursor-pointer"
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <button type="submit" className="group absolute top-2 left-2.5">
          <span className="sr-only">{placeholder}</span>
          <SearchIcon />
        </button>
      </form>
      <Suspense fallback={'...'}>
        <SearchResults
          searchValue={debouncedValue}
          isPending={inputValue !== debouncedValue}
          state={isSearchActive}
          setState={setIsSearchActive}
          onOpenInShop={() => goToShopWithQuery(debouncedValue)}
        />
      </Suspense>
    </div>
  );
};

export default SearchBar;
