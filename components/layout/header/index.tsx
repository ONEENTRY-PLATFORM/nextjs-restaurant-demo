/* eslint-disable @next/next/no-html-link-for-pages */
import type { IListTitle } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { type JSX, Suspense } from 'react';

import {
  getChildPagesByParentUrl,
  getPageByUrl,
  getProductsPriceRange,
  getSingleAttributeByMarkerSet,
} from '@/app/api';
import { t } from '@/app/dictionaries';
import LogoMobileIcon from '@/components/icons/logo-mobile.svg';
import CategoryFilter from '@/components/layout/filter/CategoryFilter';
import FilterBottom from '@/components/layout/filter/FilterBottom';
import SupportPopup from '@/components/support/SupportPopup';

import HeaderAnimations from './animations/HeaderAnimations';
import CategoriesScroller, { type PreferenceOption } from './CategoriesScroller';
import CategoryButton from './CategoryButton';
import FilterButton from './FilterButton';
import Logo from './Logo';
import MobileBurgerButton from './MobileBurgerButton';
import NavGroup from './nav/NavGroup';
import SearchBar from './search/SearchBar';
import SearchFallback from './search/SearchFallback';
import SupportButton from './SupportButton';

/**
 * Header — top-level site header.
 *
 * Fetches main-menu pages (`menu` parent) and the `support` page to populate phone/WhatsApp CTAs,
 * then renders the logo, search bar, nav groups, and mobile burger.
 *
 * @returns JSX of the header section (includes mobile/desktop variants and attached drawers).
 */
const Header = async (): Promise<JSX.Element> => {
  const { pages } = await getChildPagesByParentUrl('menu');

  const { page: supportPage } = await getPageByUrl('support');
  const supportPhone = supportPage?.attributeValues?.support_phone?.value as string | undefined;
  const supportWhatsappUrl = supportPage?.attributeValues?.support_whatsapp_url?.value as
    | string
    | undefined;

  const populatedPages = ((pages ?? []) as IPagesEntity[])
    .filter(p => p.isVisible !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const preferencesAttr = await getSingleAttributeByMarkerSet({
    setMarker: 'dish',
    attributeMarker: 'preferences',
  });
  const preferenceOptions: PreferenceOption[] =
    !preferencesAttr.isError &&
    preferencesAttr.attribute &&
    'listTitles' in preferencesAttr.attribute
      ? (preferencesAttr.attribute.listTitles as IListTitle[]).map(o => ({
          title: o.title,
          value: String(o.value),
        }))
      : [];

  const priceRange = await getProductsPriceRange();
  const searchPlaceholder = await t('search_placeholder_text', 'Search');
  const homeLabel = await t('home_label', 'Home');

  return (
    <div id="header">
      <HeaderAnimations>
        <header className="hidden md:block md:pt-15.5 md:pr-4 md:pb-4 md:pl-4 xl:pr-0 xl:pb-0 xl:pl-0">
          <div className="container px-4 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto flex flex-col">
            <NavGroup />
            <div className="flex justify-between items-center  md:gap-15 lg:gap-0">
              <div className="flex items-center justify-start md:gap-7.5 gap-15">
                <Logo />
                <h1
                  data-header-anim="slogan"
                  className="font-lato italic font-bold md:text-hero-md lg:text-[40px] xl:text-hero-xl leading-hero tracking-fine text-white md:max-w-100 lg:max-w-120"
                >
                  Excellence taste
                  <br /> in <span className="text-brand">every bite</span>
                </h1>
              </div>
              <div
                data-header-anim="search"
                className="relative z-50 flex justify-between items-center md:gap-5 gap-9.5 lg:-mt-11.25"
              >
                <Suspense fallback={<SearchFallback placeholder={searchPlaceholder} />}>
                  <SearchBar placeholder={searchPlaceholder} />
                </Suspense>
                <FilterButton />
              </div>
            </div>
          </div>
        </header>

        <div className="relative">
          <div className="relative">
            <header className="header_mobile pt-7.5 px-2.5 max-w-85 mx-auto flex flex-col md:hidden">
              <div className="flex justify-between items-center">
                <SupportButton disabled={!supportPhone && !supportWhatsappUrl} />
                <a href="/" aria-label={homeLabel} data-header-anim="logo-mobile">
                  <LogoMobileIcon title="logo" />
                </a>
                <MobileBurgerButton />
              </div>

              <div
                data-header-anim="search"
                className="relative z-50 max-w-120 w-full mx-auto mt-4.25 gap-4 flex justify-between items-center md:hidden"
              >
                <Suspense fallback={<SearchFallback placeholder={searchPlaceholder} />}>
                  <SearchBar placeholder={searchPlaceholder} />
                </Suspense>
                <FilterButton />
              </div>
            </header>

            {/* Navigation */}
            <section className="navigation max-w-auto px-4 md:py-4 xl:py-0 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto md:pb-14.75 xl:pb-14.75 flex justify-between items-end overflow-visible">
              <CategoryButton />
              <Suspense fallback={null}>
                <CategoriesScroller preferences={preferenceOptions} />
              </Suspense>
            </section>
          </div>
        </div>
      </HeaderAnimations>
      <FilterBottom preferences={preferenceOptions} priceRange={priceRange} />
      <CategoryFilter pages={populatedPages} />
      <SupportPopup phone={supportPhone} whatsappUrl={supportWhatsappUrl} />
    </div>
  );
};

export default Header;
