/* eslint-disable @next/next/no-html-link-for-pages */
import type { IListTitle } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { type JSX, Suspense } from 'react';

import {
  contentFilterToOptions,
  getChildPagesByParentUrl,
  getContentFilter,
  getPageByUrl,
  getSingleAttributeByMarkerSet,
} from '@/app/api';
import { t } from '@/app/dictionaries';
import { ATTR_SETS, CONTENT_FILTERS, PAGES, PRODUCT_ATTRS } from '@/app/utils/constants';
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
  const [
    { pages },
    { page: supportPage },
    preferencesAttr,
    dishesFilter,
    searchPlaceholder,
    homeLabel,
  ] = await Promise.all([
    getChildPagesByParentUrl(PAGES.menu),
    getPageByUrl(PAGES.support),
    getSingleAttributeByMarkerSet({
      setMarker: ATTR_SETS.dish,
      attributeMarker: PRODUCT_ATTRS.preferences,
    }),
    getContentFilter(CONTENT_FILTERS.dishes),
    t('search_placeholder_text', 'Search'),
    t('home_label', 'Home'),
  ]);

  const supportPhone = supportPage?.attributeValues?.support_phone?.value as string | undefined;
  const supportWhatsappUrl = supportPage?.attributeValues?.support_whatsapp_url?.value as
    string | undefined;

  const populatedPages = ((pages ?? []) as IPagesEntity[])
    .filter(p => p.isVisible !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const preferenceOptions: PreferenceOption[] =
    !preferencesAttr.isError &&
    preferencesAttr.attribute &&
    'listTitles' in preferencesAttr.attribute
      ? (preferencesAttr.attribute.listTitles as IListTitle[]).map(o => ({
          title: o.title,
          value: String(o.value),
        }))
      : [];

  // FilterBottom chips are sourced from the `dishes` content filter (curated grouped tree,
  // leaves target the product `filter` attribute) rather than the raw `filter` attribute listTitles.
  const filterOptions: PreferenceOption[] = contentFilterToOptions(
    dishesFilter.isError ? undefined : dishesFilter.filter
  );

  return (
    <div id="header">
      <HeaderAnimations>
        <header className="hidden md:block md:px-4 md:pt-15.5 md:pb-4 xl:px-0 xl:pb-0">
          <div className="container mx-auto flex flex-col px-4 md:max-w-175 lg:max-w-250 xl:max-w-323">
            <NavGroup />
            <div className="flex items-center justify-between  md:gap-15 lg:gap-0">
              <div className="flex items-center justify-start gap-15 md:gap-7.5">
                <Logo />
                <h1
                  data-header-anim="slogan"
                  style={{ fontFamily: 'var(--font-lato-italic)' }}
                  className="leading-hero font-bold tracking-fine text-white italic md:max-w-100 md:text-hero-md lg:max-w-120 lg:text-[40px] xl:text-hero-xl"
                >
                  Excellent taste
                  <br /> in <span className="text-brand">every bite</span>
                </h1>
              </div>
              <div
                data-header-anim="search"
                className="relative z-50 flex items-center justify-between gap-9.5 md:gap-5 lg:-mt-11.25"
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
            <header className="header_mobile mx-auto flex max-w-85 flex-col px-2.5 pt-7.5 md:hidden">
              <div data-header-anim="top-nav" className="flex items-center justify-between">
                <SupportButton disabled={!supportPhone && !supportWhatsappUrl} />
                <a href="/" aria-label={homeLabel} data-header-anim="logo-mobile">
                  <LogoMobileIcon title="logo" />
                </a>
                <MobileBurgerButton />
              </div>

              <div
                data-header-anim="search"
                className="relative z-50 mx-auto mt-4.25 flex w-full max-w-120 items-center justify-between gap-4 md:hidden"
              >
                <Suspense fallback={<SearchFallback placeholder={searchPlaceholder} />}>
                  <SearchBar placeholder={searchPlaceholder} />
                </Suspense>
                <FilterButton />
              </div>
            </header>

            {/* Navigation */}
            <section className="navigation max-w-auto mx-auto flex items-end justify-between overflow-visible px-4 md:max-w-175 md:py-4 md:pb-14.75 lg:max-w-250 xl:max-w-323 xl:py-0 xl:pb-14.75">
              <CategoryButton />
              <Suspense fallback={null}>
                <CategoriesScroller preferences={preferenceOptions} />
              </Suspense>
            </section>
          </div>
        </div>
      </HeaderAnimations>
      {/* `Suspense` isolates `useSearchParams()` inside FilterBottom — without it
          the whole route would bail out to dynamic rendering and skip ISR. */}
      <Suspense fallback={null}>
        <FilterBottom filters={filterOptions} />
      </Suspense>
      <CategoryFilter pages={populatedPages} />
      <SupportPopup phone={supportPhone} whatsappUrl={supportWhatsappUrl} />
    </div>
  );
};

export default Header;
