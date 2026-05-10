import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';

// Force-dynamic: the layout chain uses `useSearchParams()`.
export const dynamic = 'force-dynamic';

// Whitelisted block identifiers; unknown ones are silently skipped.
const HOME_BLOCK_IDENTIFIERS = new Set(['home_promo', 'recommended', 'home_categories']);

/**
 * HomePage — home page driven by blocks of the CMS `home_web` page.
 *
 * Loads the page + attached blocks (sorted by `block.position`) and for each one
 * dispatches by `block.identifier`: `home_promo` → {@link HomePromo}, `recommended`
 * → {@link HomeBlockServer}, `home_categories` → {@link HomeCategoriesSection}.
 * Reordering blocks in the admin panel changes the section order without code changes.
 *
 * @returns {Promise<JSX.Element>} Promise resolving to JSX of the home page.
 */
const HomePage = async (): Promise<JSX.Element> => {
  const { page } = await getPageByUrl('home_web');
  if (!page) {
    notFound();
  }

  const { blocks = [] } = await getBlocksByPageUrl('home_web');
  const sortedBlocks = [...blocks]
    .filter(b => b.identifier && HOME_BLOCK_IDENTIFIERS.has(b.identifier))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <>
      {sortedBlocks.map(block => {
        if (block.identifier === 'home_promo') {
          return <HomePromo key={block.id} />;
        }
        if (block.identifier === 'home_categories') {
          return <HomeCategoriesSection key={block.id} />;
        }
        return <HomeBlockServer key={block.id} marker={block.identifier as string} limit={4} />;
      })}
    </>
  );
};

export default HomePage;
