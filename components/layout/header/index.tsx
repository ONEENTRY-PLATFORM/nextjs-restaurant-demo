/* eslint-disable @next/next/no-html-link-for-pages */
import type { IListTitle } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { type JSX, Suspense } from 'react';

import {
  getChildPagesByParentUrl,
  getPageByUrl,
  getProductsByPageUrl,
  getProductsPriceRange,
  getSingleAttributeByMarkerSet,
} from '@/app/api';
import BurgerIcon from '@/components/icons/burger';
import LogoMobileIcon from '@/components/icons/logo-mobile.svg';
import PhoneIcon from '@/components/icons/phone.svg';
import CategoryFilter from '@/components/static/CategoryFilter';
import FilterBottom from '@/components/static/FilterBottom';

import CategoriesScroller, {
  type PreferenceOption,
} from './CategoriesScroller';
import CategoryButton from './CategoryButton';
import FilterButton from './FilterButton';
import Logo from './Logo';
import NavGroup from './nav/NavGroup';
import SearchBar from './search/SearchBar';
import SearchFallback from './search/SearchFallback';

/**
 * Секция Header
 * @returns React-компонент
 */
const Header = async (): Promise<JSX.Element> => {
  const { pages } = await getChildPagesByParentUrl('menu');

  // Телефон поддержки для иконки-звонилки в мобильной шапке (`support_phone`
  // на странице `support`). Если CMS-значение отсутствует — кнопка деградирует
  // в visually-disabled (без ссылки), чтобы не вести в никуда.
  const { page: supportPage } = await getPageByUrl('support');
  const supportPhone = supportPage?.attributeValues?.support_phone?.value as
    | string
    | undefined;

  // Отсекаем категории без продуктов — пустые ссылки читаются как «битые» в
  // скроллере. Проверяем каждую дочернюю страницу вызовом `limit:1` и
  // оставляем те, где `total > 0`.
  const childPages = (pages ?? []) as IPagesEntity[];
  const counts = await Promise.all(
    childPages.map(async (p) =>
      p.pageUrl
        ? (
            await getProductsByPageUrl({
              limit: 1,
              offset: 0,
              params: { handle: p.pageUrl },
            })
          ).total
        : 0,
    ),
  );
  const populatedPages = childPages.filter((_, i) => (counts[i] ?? 0) > 0);

  // Preferences-скроллер — list-type атрибут на set `dish`; каждый
  // listTitle становится чипом со ссылкой на `/shop?preferences=<value>`.
  const preferencesAttr = await getSingleAttributeByMarkerSet({
    setMarker: 'dish',
    attributeMarker: 'preferences',
  });
  const preferenceOptions: PreferenceOption[] =
    !preferencesAttr.isError &&
    preferencesAttr.attribute &&
    'listTitles' in preferencesAttr.attribute
      ? (preferencesAttr.attribute.listTitles as IListTitle[]).map((o) => ({
          title: o.title,
          value: String(o.value),
        }))
      : [];

  // Минимальная и максимальная цена реальных товаров каталога — нужна
  // FilterBottom-у, чтобы чипы Price не были захардкожены.
  const priceRange = await getProductsPriceRange();

  return (
    <div id="header">
      <header className="hidden md:block md:pt-15.5 md:pr-4 md:pb-4 md:pl-4 xl:pr-0 xl:pb-0 xl:pl-0">
        <div className="container px-4 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto flex flex-col">
          <NavGroup />
          <div className="flex justify-between items-center  md:gap-15 lg:gap-0">
            <div className="flex items-center justify-start md:gap-7.5 gap-15">
              <Logo />
              <h1 className="font-lato italic font-bold md:text-hero-md lg:text-[40px] xl:text-hero-xl leading-hero tracking-[0.02em] text-white md:max-w-100 lg:max-w-120">
                Excellence taste
                <br /> in <span className="text-brand">every bite</span>
              </h1>
            </div>
            <div className="flex justify-between items-center md:gap-5 gap-9.5 lg:-mt-11.25">
              {/* SearchBar */}
              <Suspense fallback={<SearchFallback />}>
                <SearchBar placeholder={'Search'} />
              </Suspense>
              <FilterButton />
            </div>
          </div>
        </div>
      </header>

      <div className="relative bg-custom">
        <div className="relative">
          {/* header_mobile */}
          <header className="header_mobile pt-7.5 px-2.5 max-w-88 mx-auto flex flex-col md:hidden">
            <div className="flex justify-between items-center">
              {supportPhone ? (
                <a
                  className="w-4.5 h-4.5"
                  href={'tel:' + supportPhone.replace(/\s+/g, '')}
                  aria-label={'Call ' + supportPhone}
                >
                  <PhoneIcon title="call" />
                </a>
              ) : (
                <span className="w-4.5 h-4.5 opacity-60" aria-hidden="true">
                  <PhoneIcon />
                </span>
              )}
              <a href="/" aria-label="Home">
                <LogoMobileIcon title="logo" />
              </a>
              <div className="cursor-pointer group_stroke">
                <BurgerIcon />
              </div>
            </div>

            <div className="relative max-w-120 w-full mx-auto mt-4.25 gap-4 flex justify-between items-center md:hidden">
              <Suspense fallback={<SearchFallback />}>
                <SearchBar placeholder={'Search'} />
              </Suspense>
              <FilterButton />
            </div>
          </header>

          {/* navigation */}
          <section className="navigation max-w-auto px-4 md:py-4 xl:py-0 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto md:pb-14.75 xl:pb-14.75 flex justify-between items-end overflow-visible">
            {/* Category Button */}
            <CategoryButton />
            {/* Categories Scroller */}
            <Suspense fallback={null}>
              <CategoriesScroller preferences={preferenceOptions} />
            </Suspense>
          </section>
        </div>
      </div>
      {/* Filter Bottom */}
      <FilterBottom preferences={preferenceOptions} priceRange={priceRange} />
      {/* Category Filter */}
      <CategoryFilter pages={populatedPages} />
    </div>
  );
};

export default Header;
