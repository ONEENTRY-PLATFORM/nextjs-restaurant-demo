import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import HeaderAnimGate from '@/app/animations/HeaderAnimGate';
import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
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
