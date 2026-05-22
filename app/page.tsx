import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import HeaderAnimGate from '@/app/animations/HeaderAnimGate';
import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';

// Home is OneEntry-driven content that changes only when an admin updates the
// CMS, so we cache the SSR output for 5 minutes instead of re-fetching every
// page view. Individual OneEntry fetchers also use `unstable_cache` with
// 60-300 s TTL, so even a stale-while-revalidate regeneration usually serves
// the heavy data from the data cache.
// Every `useSearchParams()` in the tree (SearchBar, CategoriesScroller,
// FilterBottom) is wrapped in `<Suspense>` upstream — `force-static` will
// fail loud at build time if anything slips back into dynamic territory,
// which is the early-warning we want.
export const dynamic = 'force-static';
export const revalidate = 300;

// Whitelisted block identifiers; unknown ones are silently skipped.
const HOME_BLOCK_IDENTIFIERS = new Set(['home_promo', 'recommended', 'home_categories']);

/**
 * HomePage — home page driven by blocks of the CMS `home_web` page.
 *
 * Loads the page + attached blocks (sorted by `block.position`) and for each one dispatches by `block.identifier`: `home_promo` → {@link HomePromo}, `recommended` → {@link HomeBlockServer}, `home_categories` → {@link HomeCategoriesSection}.
 *
 * @returns Promise resolving to JSX of the home page.
 */
const HomePage = async (): Promise<JSX.Element> => {
  const [{ page }, { blocks = [] }] = await Promise.all([
    getPageByUrl('home_web'),
    getBlocksByPageUrl('home_web'),
  ]);
  if (!page) {
    notFound();
  }
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
        return (
          <HeaderAnimGate key={block.id} delay={0.4}>
            <HomeBlockServer marker={block.identifier as string} limit={4} />
          </HeaderAnimGate>
        );
      })}
    </>
  );
};

export default HomePage;
