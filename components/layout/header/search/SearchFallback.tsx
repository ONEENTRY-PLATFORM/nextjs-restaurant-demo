import SearchIcon from '@/components/icons/search';

/**
 * SearchFallback — non-interactive search-input placeholder rendered while `SearchBar` lazy-loads.
 *
 * @param   {object}      props             - Component props.
 * @param   {string}      props.placeholder - Placeholder string, threaded from the server-resolved dictionary entry.
 * @returns JSX of the static fallback search form.
 */
const SearchFallback = ({ placeholder }: { placeholder: string }) => (
  <form className="relative">
    <input
      className="rounded w-full md:w-62.5 lg:w-83.75 h-9.5 backdrop-blur-card bg-[rgba(106,108,122,0.5)] pl-10 text-paper cursor-pointer"
      type="text"
      placeholder={placeholder}
    />
    <span className="absolute top-2 left-2.5">
      <SearchIcon />
    </span>
  </form>
);

export default SearchFallback;
