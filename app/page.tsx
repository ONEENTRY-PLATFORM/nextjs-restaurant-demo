import type { JSX } from 'react';

import HomePromo from '@/components/home/HomePromo';

// Opt out of static prerender — the shared layout chain includes client
// components that read `useSearchParams()` (search bar, filter bottom
// sheet) which Next.js requires to be wrapped in Suspense for static
// generation. Rendering dynamically sidesteps the prerender-time bailout.
export const dynamic = 'force-dynamic';
import MenuSection from '@/components/home/MenuSection';
import {
  beveragesItems,
  breakfastItems,
  desertItems,
  firstCourseItems,
  lunchItems,
  mainCourseItems,
  recommendedItems,
} from '@/components/home/mockMenuData';

/**
 * Home page — 1:1 port of `static-html/index.html`.
 *
 * Sections, in mockup order with exact card counts from the verstka:
 *   1. `HomePromo` — desktop "DEAL OF THE DAY -50%" + mobile promo strip.
 *   2. Recomended (6 cards).
 *   3. Brackfast (8 cards).
 *   4. LUNCH (6 cards).
 *   5. FIRST COURSE / SOUP (8 cards).
 *   6. MAIN COURSE (8 cards).
 *   7. DESERT (8 cards).
 *   8. BEVERAGEs (8 cards).
 *
 * Data: mock content from `components/home/mockMenuData.ts` (verstka doesn't
 * ship with real CMS data). "View all" link navigates to `/shop/category/
 * <marker>` — the catalog page mirrors `index_category.html` from the mockup.
 * @returns {JSX.Element} Home page JSX.
 */
const HomePage = (): JSX.Element => {
  const sectionBase =
    'max-w-87.5 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto w-full';

  return (
    <>
      <HomePromo />

      <MenuSection
        title="Recomended"
        categoryMarker="recommended"
        items={recommendedItems}
        className={`${sectionBase} mt-7.5 md:mt-12.5 pb-1.25`}
        gridClassName="menu_items"
      />

      <div className="bg-[rgba(76,77,86,0.8)]">
        <MenuSection
          title="Brackfast"
          categoryMarker="breakfast"
          items={breakfastItems}
          className={`${sectionBase} pt-3.75`}
        />
      </div>

      <MenuSection
        title="LUNCH"
        categoryMarker="lunch"
        items={lunchItems}
        className={`${sectionBase} pt-3.75 md:pt-8.75`}
        gridClassName="menu_items pt-[25px] md:pt-[10px]"
      />

      <div className="bg-[rgba(76,77,86,0.8)]">
        <MenuSection
          title="FIRST COURSE / SOUP"
          categoryMarker="first_courses"
          items={firstCourseItems}
          className={`${sectionBase} pt-3.75`}
          gridClassName="menu_items pt-[14px]"
          mobileGridClassName="menu_items md:hidden pt-[14px]"
        />
      </div>

      <MenuSection
        title="MAIN COURSE"
        categoryMarker="main_courses"
        items={mainCourseItems}
        className={`${sectionBase} pt-3.75 md:pt-8.75`}
        gridClassName="menu_items"
      />

      <div className="bg-[rgba(76,77,86,0.8)]">
        <MenuSection
          title="DESERT"
          categoryMarker="desserts"
          items={desertItems}
          className={`${sectionBase} pt-3.75`}
          gridClassName="menu_items pt-[13px]"
        />
      </div>

      <MenuSection
        title="BEVERAGEs"
        categoryMarker="cold_beverages"
        items={beveragesItems}
        className={`${sectionBase} pt-3.75 md:pt-6.25`}
        gridClassName="menu_items pt-[13px] md:pt-[20px]"
      />
    </>
  );
};

export default HomePage;
