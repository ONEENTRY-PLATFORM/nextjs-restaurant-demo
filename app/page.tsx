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
 *   3. Brackfast (8 cards, dark wrapper).
 *   4. LUNCH (6 cards).
 *   5. FIRST COURSE / SOUP (8 cards, dark wrapper).
 *   6. MAIN COURSE (8 cards).
 *   7. DESERT (7 cards, dark wrapper).
 *   8. BEVERAGEs (8 cards).
 *
 * Data: mock content from `components/home/mockMenuData.ts` (verstka doesn't
 * ship with real CMS data). "View all" link navigates to `/shop/category/
 * <marker>` — the catalog page mirrors `index_category.html` from the mockup.
 * @returns {JSX.Element} Home page JSX.
 */
const HomePage = (): JSX.Element => {
  return (
    <>
      <HomePromo />

      <MenuSection
        title="Recomended"
        categoryMarker="recommended"
        items={recommendedItems}
        gridClassName="menu_items"
      />

      <MenuSection
        title="Brackfast"
        categoryMarker="breakfast"
        items={breakfastItems}
        wrapperClassName="bg-[rgba(76,77,86,0.8)]"
      />

      <MenuSection title="LUNCH" categoryMarker="lunch" items={lunchItems} />

      <MenuSection
        title="FIRST COURSE / SOUP"
        categoryMarker="first_courses"
        items={firstCourseItems}
        wrapperClassName="bg-[rgba(76,77,86,0.8)]"
      />

      <MenuSection
        title="MAIN COURSE"
        categoryMarker="main_courses"
        items={mainCourseItems}
      />

      <MenuSection
        title="DESERT"
        categoryMarker="dessert"
        items={desertItems}
        wrapperClassName="bg-[rgba(76,77,86,0.8)]"
      />

      <MenuSection
        title="BEVERAGEs"
        categoryMarker="beverages"
        items={beveragesItems}
      />
    </>
  );
};

export default HomePage;
