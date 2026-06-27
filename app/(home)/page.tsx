import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import HeaderAnimGate from '@/app/animations/HeaderAnimGate';
import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import { BLOCKS, PAGES } from '@/app/utils/constants';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';

export const dynamic = 'force-static';
export const revalidate = 300;

// Whitelisted block identifiers
const HOME_BLOCK_ORDER: readonly string[] = [
  BLOCKS.homePromo,
  BLOCKS.recommended,
  BLOCKS.homeCategories,
];
const HOME_BLOCK_IDENTIFIERS = new Set<string>(HOME_BLOCK_ORDER);

/**
 * HomePage — home page driven by blocks of the CMS `home_web` page.
 *
 * @returns Promise resolving to JSX of the home page.
 */
const HomePage = async (): Promise<JSX.Element> => {
  const [{ page }, { blocks = [] }] = await Promise.all([
    getPageByUrl(PAGES.home),
    getBlocksByPageUrl(PAGES.home),
  ]);

  if (!page) {
    notFound();
  }
  const cmsBlocks = [...blocks]
    .filter(b => b.identifier && HOME_BLOCK_IDENTIFIERS.has(b.identifier))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const renderItems: { key: string; identifier: string }[] =
    cmsBlocks.length > 0
      ? cmsBlocks.map(b => ({ key: String(b.id), identifier: b.identifier as string }))
      : HOME_BLOCK_ORDER.map(id => ({ key: `fallback:${id}`, identifier: id }));

  return (
    <>
      {renderItems.map(({ key, identifier }) => {
        if (identifier === BLOCKS.homePromo) {
          return <HomePromo key={key} />;
        }
        if (identifier === BLOCKS.homeCategories) {
          return <HomeCategoriesSection key={key} />;
        }
        return (
          <HeaderAnimGate key={key} delay={1.0}>
            <HomeBlockServer marker={identifier} limit={4} fallbackToCatalog />
          </HeaderAnimGate>
        );
      })}
    </>
  );
};

export default HomePage;
