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

// Whitelisted block identifiers, in the order they should appear on the home page.
// Used both as a filter for CMS-driven blocks and as a fallback list when the
// `home_web` page has no blocks attached in OneEntry (see ONEENTRY-ADMIN-TODO C.2.5).
const HOME_BLOCK_ORDER: readonly string[] = [
  BLOCKS.homePromo,
  BLOCKS.recommended,
  BLOCKS.homeCategories,
];
const HOME_BLOCK_IDENTIFIERS = new Set<string>(HOME_BLOCK_ORDER);

/**
 * HomePage — home page driven by blocks of the CMS `home_web` page.
 *
 * Loads the page + attached blocks (sorted by `block.position`) and for each one dispatches by `block.identifier`: `home_promo` → {@link HomePromo}, `recommended` → {@link HomeBlockServer}, `home_categories` → {@link HomeCategoriesSection}. If CMS returns no whitelisted blocks (e.g. blocks were detached from the page), falls back to a hardcoded list in {@link HOME_BLOCK_ORDER}.
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
        // Recommended fades in right after HomePromo (delay 0.5 + 0.5 s fade).
        // fallbackToCatalog: the `recommended` block is a `similar_products_block` whose products
        // are unavailable to the anonymous home SSR (similarProducts → 403, see ONEENTRY-ADMIN-TODO
        // C.2.8); backfill with catalog products so the row never vanishes.
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
