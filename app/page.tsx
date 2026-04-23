import type { JSX } from 'react';

import { getDictionary } from '@/app/api/utils/dictionaries';

export const dynamic = 'force-dynamic';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import HomePromo from '@/components/home/HomePromo';
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
 * Home page — 1:1 port of `static-html/index.html` (header chrome comes
 * from the shared `RootLayout`; body sections live here).
 *
 * Each `MenuSection` below:
 *   - Accepts a `categoryMarker` (OneEntry `pageUrl`) so the real
 *     `ProductsGrid`/`ProductCard` is used when the CMS returns items.
 *   - Falls back to the mock dataset from `mockMenuData.ts` otherwise,
 *     matching the look in `static-html/index.html` 1:1.
 * @returns {JSX.Element} Home page JSX.
 */
const HomePage = async (): Promise<JSX.Element> => {
  const [dict] = ServerProvider('dict', await getDictionary());

  return (
    <>
      <HomePromo />

      <MenuSection
        title="Recomended"
        categoryMarker="recommended"
        items={recommendedItems}
        viewAllCount={8}
        dict={dict}
        className="recomended max-w-[350px] md:max-w-[700px] lg:max-w-[1000px] xl:max-w-[1292px] mx-auto mt-[30px] md:mt-[50px] pb-[5px] w-full"
        gridClassName="menu_items"
      />

      <MenuSection
        title="Brackfast"
        categoryMarker="breakfast"
        items={breakfastItems}
        viewAllCount={8}
        dict={dict}
        wrapperClassName="bg-[rgba(76,77,86,0.8)]"
      />

      <MenuSection
        title="LUNCH"
        categoryMarker="lunch"
        items={lunchItems}
        viewAllCount={6}
        dict={dict}
      />

      <MenuSection
        title="FIRST COURSE / SOUP"
        categoryMarker="first_courses"
        items={firstCourseItems}
        viewAllCount={8}
        dict={dict}
        wrapperClassName="bg-[rgba(76,77,86,0.8)]"
      />

      <MenuSection
        title="MAIN COURSE"
        categoryMarker="main_courses"
        items={mainCourseItems}
        viewAllCount={8}
        dict={dict}
      />

      <MenuSection
        title="DESERT"
        categoryMarker="dessert"
        items={desertItems}
        viewAllCount={8}
        dict={dict}
        wrapperClassName="bg-[rgba(76,77,86,0.8)]"
      />

      <MenuSection
        title="BEVERAGEs"
        categoryMarker="beverages"
        items={beveragesItems}
        viewAllCount={8}
        dict={dict}
      />
    </>
  );
};

export default HomePage;
