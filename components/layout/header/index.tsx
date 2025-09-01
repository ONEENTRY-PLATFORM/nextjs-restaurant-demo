import { type FC, Suspense } from 'react';

import { ServerProvider } from '@/app/store/providers/ServerProvider';
import SearchIcon from '@/components/icons/search';
import NavigationMenu from '@/components/layout/header/main-menu';

import Logo from './Logo';
import NavGroup from './nav/NavGroup';
import SearchBar from './search/SearchBar';

/**
 * Header section
 * @returns React component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Header: FC<{ menu: any }> = async ({ menu }) => {
  // Retrieve props from server provider
  const [dict] = ServerProvider('dict');
  const { search_placeholder } = dict;

  const Fallback = () => (
    <form className="relative">
      <input
        className="rounded md:w-[250px] lg:w-[335px] h-[38px] backdrop-blur-[10px] bg-[rgba(106,108,122,0.5)] pl-[40px] text-[#dfe9f9] cursor-pointer"
        type="text" placeholder="soup" />
      <svg className="absolute top-[8px] left-2.5" width="22" height="22" viewBox="0 0 22 22" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15.3043 15.3044L20 20M16.8696 9.43476C16.8696 13.5409 13.5409 16.8695 9.4348 16.8695C5.32867 16.8695 2 13.5409 2 9.43476C2 5.32866 5.32867 2 9.4348 2C13.5409 2 16.8696 5.32866 16.8696 9.43476Z"
          stroke="#EC722B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </form>
  );

  return (
    <div id="header">
      {/* <header className="flex flex-col items-center px-5 pb-6 pt-10 text-center backdrop-blur-lg max-lg:py-5 max-md:px-5 max-md:py-3 max-sm:py-1">
        <section className="flex w-full max-w-[1400px] flex-row items-center justify-between gap-5 max-md:flex max-md:max-w-full max-md:flex-row max-md:flex-wrap">
          <div
            className={
              'min-2xl:w-[30%] relative box-border flex w-1/5 shrink-0 flex-col'
            }
          >
            <Logo />
          </div>
          <div className="fade-in">
            <Suspense fallback={<Fallback />}>
              <SearchBar placeholder={search_placeholder?.value || 'Search'} />
            </Suspense>
          </div>
          <NavGroup />
        </section>
      </header> */}
      <header className="hidden md:block md:pt-[62px] md:pr-4 md:pb-4 md:pl-4 xl:pr-0 xl:pb-0 xl:pl-0">
        <div className="container md:max-w-[700px] lg:max-w-[1000px] xl:max-w-[1292px] mx-auto flex flex-col">
          <NavGroup />
          <div className="flex justify-between items-center  md:gap-[60px] lg:gap-0">
            <div className="flex items-center justify-start md:gap-[30px] gap-[60px]">
              <Logo />
              <h1 className="font-lato italic font-bold md:text-[30px] lg:text-[48px] xl:text-[62px] leading-[97%] tracking-[0.02em] text-white md:max-w-[400px] lg:max-w-[440px]">
                Excellence taste in <span className="text-custom_orange">every bite</span></h1>
            </div>
            <div className="flex justify-between items-center md:gap-[20px] gap-[38px] lg:mt-[-45px]">
              <Suspense fallback={<Fallback />}>
                <SearchBar placeholder={search_placeholder?.value || 'Search'} />
              </Suspense>
              <div className="cursor-pointer group">
                <svg className="fill-[#DFE9F9] hover-target" width="21" height="20" viewBox="0 0 21 20" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd"
                    d="M16.7949 1.11111C16.7949 0.816426 16.6769 0.533811 16.4669 0.325437C16.257 0.117063 15.9722 0 15.6752 0C15.3783 0 15.0935 0.117063 14.8835 0.325437C14.6735 0.533811 14.5556 0.816426 14.5556 1.11111V2.22222H1.11966C0.822706 2.22222 0.537917 2.33929 0.32794 2.54766C0.117964 2.75603 0 3.03865 0 3.33333C0 3.62802 0.117964 3.91063 0.32794 4.11901C0.537917 4.32738 0.822706 4.44444 1.11966 4.44444H14.5556V5.55556C14.5556 5.85024 14.6735 6.13286 14.8835 6.34123C15.0935 6.5496 15.3783 6.66667 15.6752 6.66667C15.9722 6.66667 16.257 6.5496 16.4669 6.34123C16.6769 6.13286 16.7949 5.85024 16.7949 5.55556V4.44444H19.0342C19.3311 4.44444 19.6159 4.32738 19.8259 4.11901C20.0359 3.91063 20.1538 3.62802 20.1538 3.33333C20.1538 3.03865 20.0359 2.75603 19.8259 2.54766C19.6159 2.33929 19.3311 2.22222 19.0342 2.22222H16.7949V1.11111ZM1.11966 8.88889C0.822706 8.88889 0.537917 9.00595 0.32794 9.21433C0.117964 9.4227 0 9.70532 0 10C0 10.2947 0.117964 10.5773 0.32794 10.7857C0.537917 10.994 0.822706 11.1111 1.11966 11.1111H3.35897V12.2222C3.35897 12.5169 3.47694 12.7995 3.68691 13.0079C3.89689 13.2163 4.18168 13.3333 4.47863 13.3333C4.77558 13.3333 5.06037 13.2163 5.27035 13.0079C5.48033 12.7995 5.59829 12.5169 5.59829 12.2222V11.1111H19.0342C19.3311 11.1111 19.6159 10.994 19.8259 10.7857C20.0359 10.5773 20.1538 10.2947 20.1538 10C20.1538 9.70532 20.0359 9.4227 19.8259 9.21433C19.6159 9.00595 19.3311 8.88889 19.0342 8.88889H5.59829V7.77778C5.59829 7.48309 5.48033 7.20048 5.27035 6.9921C5.06037 6.78373 4.77558 6.66667 4.47863 6.66667C4.18168 6.66667 3.89689 6.78373 3.68691 6.9921C3.47694 7.20048 3.35897 7.48309 3.35897 7.77778V8.88889H1.11966ZM0 16.6667C0 16.372 0.117964 16.0894 0.32794 15.881C0.537917 15.6726 0.822706 15.5556 1.11966 15.5556H14.5556V14.4444C14.5556 14.1498 14.6735 13.8671 14.8835 13.6588C15.0935 13.4504 15.3783 13.3333 15.6752 13.3333C15.9722 13.3333 16.257 13.4504 16.4669 13.6588C16.6769 13.8671 16.7949 14.1498 16.7949 14.4444V15.5556H19.0342C19.3311 15.5556 19.6159 15.6726 19.8259 15.881C20.0359 16.0894 20.1538 16.372 20.1538 16.6667C20.1538 16.9614 20.0359 17.244 19.8259 17.4523C19.6159 17.6607 19.3311 17.7778 19.0342 17.7778H16.7949V18.8889C16.7949 19.1836 16.6769 19.4662 16.4669 19.6746C16.257 19.8829 15.9722 20 15.6752 20C15.3783 20 15.0935 19.8829 14.8835 19.6746C14.6735 19.4662 14.5556 19.1836 14.5556 18.8889V17.7778H1.11966C0.822706 17.7778 0.537917 17.6607 0.32794 17.4523C0.117964 17.244 0 16.9614 0 16.6667Z"
                    fill="#DFE9F9" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
