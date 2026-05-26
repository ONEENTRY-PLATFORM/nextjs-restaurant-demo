import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import HeaderAnimGate from '@/app/animations/HeaderAnimGate';
import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import { BLOCKS, PAGES } from '@/app/utils/constants';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';

// HOTFIX: Next 16.2.6 prerenders this page as a multipart/mixed payload
// (boundary `--<hex>` + inner segment-prefetch headers leaked into the body)
// when statically generated. Vercel CDN faithfully serves it with
// `Content-Type: text/html`, the browser parses the boundary lines as text
// nodes, and hydration breaks. Switching to `force-dynamic` bypasses the
// broken prerender path until a Next/Vercel fix lands; the underlying SDK
// calls still hit `unstable_cache` (60-300 s TTL), so the data layer remains
// cached even though the HTML shell is rendered per-request.
export const dynamic = 'force-dynamic';

// Whitelisted block identifiers; unknown ones are silently skipped.
const HOME_BLOCK_IDENTIFIERS = new Set<string>([
  BLOCKS.homePromo,
  BLOCKS.recommended,
  BLOCKS.homeCategories,
]);

/**
 * HomePage — home page driven by blocks of the CMS `home_web` page.
 *
 * Loads the page + attached blocks (sorted by `block.position`) and for each one dispatches by `block.identifier`: `home_promo` → {@link HomePromo}, `recommended` → {@link HomeBlockServer}, `home_categories` → {@link HomeCategoriesSection}.
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
  const sortedBlocks = [...blocks]
    .filter(b => b.identifier && HOME_BLOCK_IDENTIFIERS.has(b.identifier))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <>
      {sortedBlocks.map(block => {
        if (block.identifier === BLOCKS.homePromo) {
          return <HomePromo key={block.id} />;
        }
        if (block.identifier === BLOCKS.homeCategories) {
          return <HomeCategoriesSection key={block.id} />;
        }
        // Recommended fades in right after HomePromo (delay 0.5 + 0.5 s fade).
        return (
          <HeaderAnimGate key={block.id} delay={1.0}>
            <HomeBlockServer marker={block.identifier as string} limit={4} />
          </HeaderAnimGate>
        );
      })}
    </>
  );
};

export default HomePage;
