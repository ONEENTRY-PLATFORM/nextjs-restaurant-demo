'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent, JSX } from 'react';
import { Suspense, useState } from 'react';
import { useDebounce } from 'use-debounce';

import SearchIcon from '@/components/icons/search';

import SearchResults from './SearchResults';

/** Header search bar. */
const SearchBar = ({ placeholder }: { placeholder: string }): JSX.Element => {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchActive, setIsSearchActive] = useState(false);

  const searchValue = searchParams.get('search') || '';
  const [debouncedValue] = useDebounce(searchValue, 300);

  const handleSearch = (term: string) => {
    if (term) {
      params.set('search', term);
      setIsSearchActive(true);
    } else {
      params.delete('search');
      setIsSearchActive(false);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.replace(`/services?${params.toString()}`);
    setIsSearchActive(false);
  };

  return (
    <div className="relative grow">
      <form className="relative" onSubmit={handleSubmit}>
        <input
          defaultValue={debouncedValue}
          onChange={e => handleSearch(e.target.value)}
          type="search"
          id="searchInput"
          name="quick-search"
          className="rounded w-full md:w-62.5 lg:w-83.75 h-9.5 backdrop-blur-[10px] bg-[rgba(106,108,122,0.5)] pl-10 text-paper cursor-pointer"
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
          isPending={searchValue !== debouncedValue}
          state={isSearchActive}
          setState={setIsSearchActive}
        />
      </Suspense>
    </div>
  );
};

export default SearchBar;
