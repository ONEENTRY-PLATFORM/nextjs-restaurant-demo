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
        return (
          <HeaderAnimGate key={key} delay={1.0}>
            <HomeBlockServer marker={identifier} limit={4} />
          </HeaderAnimGate>
        );
      })}
    </>
  );
};

export default HomePage;
