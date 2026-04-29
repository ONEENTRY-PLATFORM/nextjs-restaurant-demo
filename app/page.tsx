import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import {
  getAllOrdersByMarker,
  getBlocksByPageUrl,
  getPageByUrl,
} from '@/app/api';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';
import type {
  OrderReviewLineMock,
  OrderReviewMock,
} from '@/components/reviews/mockOrderReviewData';
import OrderReviewsPanel from '@/components/reviews/OrderReviewsPanel';

// Opt out of static prerender — the shared layout chain includes client
// components that read `useSearchParams()` (search bar, filter bottom
// sheet) which Next.js requires to be wrapped in Suspense for static
// generation. Rendering dynamically sidesteps the prerender-time bailout.
export const dynamic = 'force-dynamic';

const SECTION_BASE =
  'max-w-87.5 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto w-full px-4';

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
 * Format an ISO / ms date as `dd.MM.yy` to match the order pill in
 * `static-html/index_rewiews.html`. Mirrors the helper in
 * [components/profile/OrdersList.tsx](../components/profile/OrdersList.tsx).
 * @param   {string | number | Date | undefined} when - Input date value.
 * @returns {string}                                    Formatted stamp.
 */
const formatDate = (when: string | number | Date | undefined): string => {
  if (!when) return '';
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(
    d.getFullYear(),
  ).slice(2)}`;
};

/**
 * Resolve the review-panel order projection for `?review_order=<id|orderId>`.
 * Returns `null` when the param is absent (panel won't render); falls back
 * to the {@link OrderReviewsPanel}'s built-in mock when the order can't be
 * fetched (no auth, fetch error, no match) so the drawer still shows the
 * static-html design — see CLAUDE.md rule 2 (mocks must keep the layout
 * non-empty until the CMS pipeline is ready).
 * @param   {string} reviewOrderParam - Raw `?review_order` value.
 * @returns {Promise<OrderReviewMock | null | undefined>} Order projection, mock-fallback (`undefined`), or `null`.
 */
const resolveReviewOrder = async (
  reviewOrderParam: string,
): Promise<OrderReviewMock | null | undefined> => {
  // Special tokens / unauth flow → use the panel's built-in mock.
  if (!reviewOrderParam || reviewOrderParam === 'demo') return undefined;

  const res = await getAllOrdersByMarker({
    marker: 'delivery_order',
    offset: 0,
    limit: 50,
  });
  if (res.isError || !res.orders) return undefined;

  const match = res.orders.find(
    (o) =>
      String(o.id) === reviewOrderParam ||
      (o as unknown as { orderId?: string }).orderId === reviewOrderParam,
  );
  if (!match) return undefined;

  const lines: OrderReviewLineMock[] = match.products.map((p, idx) => ({
    id: `${match.id}-${p.id}-${idx}`,
    productId: typeof p.id === 'number' ? p.id : Number(p.id) || null,
    title: p.title,
    imageSrc: p.previewImage?.previewLink ?? '/images/picture/favorites1.png',
  }));
  lines.push({
    id: `${match.id}-delivery`,
    productId: null,
    title: 'Delivery',
    imageSrc: '/images/icons/delivery.svg',
    isDelivery: true,
  });

  const orderId = (match as unknown as { orderId?: string }).orderId;
  const created = (match as unknown as { createdDate?: string }).createdDate;
  const localized = (
    match.statusLocalizeInfos as { title?: string } | undefined
  )?.title;

  return {
    orderNumber: orderId ?? String(match.id),
    status: localized ?? match.statusIdentifier ?? '',
    date: formatDate(created),
    lines,
  };
};

/**
 * Home page — fully driven by OneEntry CMS:
 *   1. Fetch the `home_web` page entity to verify it exists (and to keep
 *      a hook for future page-level metadata / hero attributes).
 *   2. Fetch its attached blocks via `getBlocksByPageUrl`, sorted by
 *      `block.position`.
 *   3. For each block, dispatch by `block.identifier`:
 *        - `home_promo`      → static {@link HomePromo} banner (DEAL OF
 *                              THE DAY -50%). The CMS block is used only
 *                              as a positional anchor; banner content is
 *                              hardcoded until the block exposes
 *                              title/product/image attributes.
 *        - `recommended`     → curated grid via {@link HomeBlockServer}
 *        - `home_categories` → all menu category sections via
 *                              {@link HomeCategoriesSection}
 *      Reordering blocks in admin (`block.position`) reorders sections on
 *      the page without code changes.
 * @returns {Promise<JSX.Element>} Home page JSX.
 */
const HomePage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ review_order?: string }>;
}): Promise<JSX.Element> => {
  const { page } = await getPageByUrl('home_web');
  if (!page) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const reviewOrderRaw = sp.review_order;
  const reviewOrder = reviewOrderRaw
    ? await resolveReviewOrder(reviewOrderRaw)
    : null;

  const { blocks = [] } = await getBlocksByPageUrl({ pageUrl: 'home_web' });
  const sortedBlocks = [...blocks]
    .filter((b) => b.identifier && HOME_BLOCK_IDENTIFIERS.has(b.identifier))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <>
      {sortedBlocks.map((block) => {
        if (block.identifier === 'home_promo') {
          return <HomePromo key={block.id} />;
        }
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
      {reviewOrderRaw ? (
        <OrderReviewsPanel order={reviewOrder ?? null} />
      ) : null}
    </>
  );
};

export default HomePage;
