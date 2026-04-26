import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';

// Opt out of static prerender — the shared layout chain includes client
// components that read `useSearchParams()` (search bar, filter bottom
// sheet) which Next.js requires to be wrapped in Suspense for static
// generation. Rendering dynamically sidesteps the prerender-time bailout.
export const dynamic = 'force-dynamic';

const SECTION_BASE =
  'max-w-87.5 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto w-full';

/**
 * Block identifier → section type. Each block attached to the `home_web`
 * page acts as a positional marker for one of these section components,
 * so reordering blocks in the OneEntry admin (`block.position`) reorders
 * sections on the page without code changes.
 *
 * Identifiers not listed here are skipped silently — the editor can
 * stage new blocks without breaking the build, and we add a renderer
 * for them when the visual story is ready.
 */
const HOME_BLOCK_IDENTIFIERS = new Set([
  'home_promo',
  'recommended',
  'home_categories',
]);

/**
 * Home page — fully driven by OneEntry CMS:
 *   1. Fetch the `home_web` page entity to verify it exists (and to keep
 *      a hook for future page-level metadata / hero attributes).
 *   2. Fetch its attached blocks via `getBlocksByPageUrl`, sorted by
 *      `block.position`.
 *   3. For each block, dispatch by `block.identifier`:
 *        - `home_promo`      → curated promo via {@link HomeBlockServer}
 *        - `recommended`     → curated grid via {@link HomeBlockServer}
 *        - `home_categories` → all menu category sections via
 *                              {@link HomeCategoriesSection}
 *      Swapping the position of `home_categories` with `home_promo` in
 *      admin moves the entire category list above the promo banner —
 *      the page render mirrors block ordering exactly.
 *
 * `<HomePromo />` (the static mobile-only carousel of promo PNGs) stays
 * pinned above the dynamic blocks since it serves a different visual
 * purpose and isn't yet block-driven.
 * @returns {Promise<JSX.Element>} Home page JSX.
 */
const HomePage = async (): Promise<JSX.Element> => {
  const { page } = await getPageByUrl('home_web');
  if (!page) {
    notFound();
  }

  const { blocks = [] } = await getBlocksByPageUrl({ pageUrl: 'home_web' });
  const sortedBlocks = [...blocks]
    .filter((b) => b.identifier && HOME_BLOCK_IDENTIFIERS.has(b.identifier))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <>
      <HomePromo />
      {sortedBlocks.map((block) => {
        if (block.identifier === 'home_categories') {
          return <HomeCategoriesSection key={block.id} />;
        }
        return (
          <HomeBlockServer
            key={block.id}
            marker={block.identifier as string}
            className={`${SECTION_BASE} pt-3.75 md:pt-6.25 pb-1.25`}
          />
        );
      })}
    </>
  );
};

export default HomePage;
