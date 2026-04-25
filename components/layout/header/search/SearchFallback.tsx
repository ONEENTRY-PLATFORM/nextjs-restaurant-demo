import SearchIcon from '@/components/icons/search';

const SearchFallback = () => (
  <form className="relative">
    <input
      className="rounded md:w-62.5 lg:w-83.75 h-9.5 backdrop-blur-[10px] bg-[rgba(106,108,122,0.5)] pl-10 text-paper cursor-pointer"
      type="text"
      placeholder="soup"
    />
    <span className="absolute top-2 left-2.5">
      <SearchIcon />
    </span>
  </form>
);

export default SearchFallback;
