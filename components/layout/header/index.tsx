/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { type JSX, Suspense } from 'react';

import { getChildPagesByParentUrl } from '@/app/api';
import BurgerIcon from '@/components/icons/burger';
import CategoryFilter from '@/components/static/CategoryFilter';
import FilterBottom from '@/components/static/FilterBottom';

import CategoriesScroller from './CategoriesScroller';
import CategoryButton from './CategoryButton';
import FilterButton from './FilterButton';
import Logo from './Logo';
import NavGroup from './nav/NavGroup';
import SearchBar from './search/SearchBar';
import SearchFallback from './search/SearchFallback';

/**
 * Header section
 * @returns React component
 */
const Header = async (): Promise<JSX.Element> => {
  const { pages } = await getChildPagesByParentUrl('menu');

  return (
    <div id="header">
      <header className="hidden md:block md:pt-15.5 md:pr-4 md:pb-4 md:pl-4 xl:pr-0 xl:pb-0 xl:pl-0">
        <div className="container md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto flex flex-col">
          <NavGroup />
          <div className="flex justify-between items-center  md:gap-15 lg:gap-0">
            <div className="flex items-center justify-start md:gap-7.5 gap-15">
              <Logo />
              <h1 className="font-lato italic font-bold md:text-[30px] lg:text-[48px] xl:text-[62px] leading-[97%] tracking-[0.02em] text-white md:max-w-100 lg:max-w-120">
                Excellence taste
                <br /> in <span className="text-custom_orange">every bite</span>
              </h1>
            </div>
            <div className="flex justify-between items-center md:gap-5 gap-9.5 lg:-mt-11.25">
              {/* SearchBar */}
              <Suspense fallback={<SearchFallback />}>
                <SearchBar placeholder={'soup'} />
              </Suspense>
              <FilterButton />
            </div>
          </div>
        </div>
      </header>

      <div className="relative pb-7.5 md:pb-0 bg-custom">
        <div className="relative">
          {/* header_mobile */}
          <header className="header_mobile pt-7.5 px-2.5 max-w-88 mx-auto flex flex-col md:hidden">
            <div className="flex justify-between items-center">
              <a className="w-4.5 h-4.5" href="#">
                <img src="/images/icons/phone.svg" alt="call" />
              </a>
              <a href="/">
                <img src="/images/logo_mobile.svg" alt="logo" />
              </a>
              <div className="cursor-pointer group_stroke">
                <BurgerIcon />
              </div>
            </div>

            <div className="relative max-w-120  mx-auto mt-4.25 gap-4 flex justify-between items-center md:hidden">
              <Suspense fallback={<SearchFallback />}>
                <SearchBar placeholder={'soup'} />
              </Suspense>
              <FilterButton />
            </div>
          </header>

          {/* navigation */}
          <section className="navigation max-w-auto md:py-4 xl:p-0 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto md:pb-14.75 xl:pb-14.75 flex justify-between items-end overflow-visible">
            {/* Category Button */}
            <CategoryButton />
            {/* Categories Scroller */}
            <CategoriesScroller pages={(pages ?? []) as IPagesEntity[]} />
          </section>
        </div>
      </div>
      {/* Filter Bottom */}
      <FilterBottom />
      {/* Category Filter */}
      <CategoryFilter pages={(pages ?? []) as IPagesEntity[]} />
    </div>
  );
};

export default Header;
