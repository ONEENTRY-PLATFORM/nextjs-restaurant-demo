'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent, JSX } from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

import SearchIcon from '@/components/icons/search';

import SearchResults from './SearchResults';

/**
 * isShopListingPath — `true` when the pathname is a shop listing route (root catalog or
 * category) where the server-side product grid reads `?search=` and refilters live.
 *
 * @param   {string} pathname - Current pathname.
 * @returns `true` when the path participates in live filtering.
 */
const isShopListingPath = (pathname: string): boolean =>
  pathname === '/shop' || (pathname.startsWith('/shop/') && !pathname.startsWith('/shop/product'));

/**
 * SearchBar — header search input with debounced query and a results dropdown.
 *
 * On shop listing pages (`isShopListingPath`) the debounced value is mirrored into `?search=` via `router.replace`; on other routes the value is held only in local state. Pressing Enter navigates to `/shop?search=<query>`.
 *
 * @param   {object}      props             - Component props.
 * @param   {string}      props.placeholder - Placeholder/aria-label for the input.
 * @returns JSX of the search input with suspended results panel.
 */
const SearchBar = ({ placeholder }: { placeholder: string }): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const isShopListing = isShopListingPath(pathname);

  const [inputValue, setInputValue] = useState(() => urlSearchParams.get('search') ?? '');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [debouncedValue] = useDebounce(inputValue, 300);
  const urlSearch = urlSearchParams.get('search') ?? '';

  // The header renders two `SearchBar` instances (desktop + mobile). Without this guard
  // both would race to push `?search=` from their stale local state and ping-pong the URL.
  // The flag stays `false` until the user types here, so a passive bar only mirrors the URL.
  const userTypedRef = useRef(false);

  // Force-close the dropdown on shop listing routes (the grid filters live, the panel would
  // duplicate the visible result). Done in render via the prev-prop pattern instead of an effect
  // to avoid the cascading-renders warning from synchronous setState inside `useEffect`.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (isShopListing) setIsSearchActive(false);
  }

  // Reset "this bar typed last" ownership when the route changes — a new page is not "ours".
  useEffect(() => {
    userTypedRef.current = false;
  }, [pathname]);

  // Mirror URL → input when this bar didn't initiate the change.
  useEffect(() => {
    if (urlSearch === inputValue) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(urlSearch);
    userTypedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  useEffect(() => {
    if (!isShopListing) return;
    if (!userTypedRef.current) return;
    const trimmed = debouncedValue.trim();
    if (trimmed === urlSearch) return;
    const next = new URLSearchParams(urlSearchParams.toString());
    if (trimmed) next.set('search', trimmed);
    else next.delete('search');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedValue, isShopListing, pathname, router, urlSearch, urlSearchParams]);

  const handleChange = (term: string) => {
    userTypedRef.current = true;
    setInputValue(term);
    // On shop listing routes the grid filters cards live via `?search=`,
    // so the dropdown panel would just duplicate the visible result.
    setIsSearchActive(!isShopListing && term.length > 0);
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
          onOpenInShop={isShopListing ? null : () => goToShopWithQuery(debouncedValue)}
        />
      </Suspense>
    </div>
  );
};

export default SearchBar;
