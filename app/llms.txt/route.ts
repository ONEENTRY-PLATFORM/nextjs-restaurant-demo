import type { IPagesEntity } from 'oneentry/types';

import { getChildPagesByParentUrl } from '@/app/api/server/pages/getChildPagesByParentUrl';
import { getPageByUrl } from '@/app/api/server/pages/getPageByUrl';
import { getProducts } from '@/app/api/server/products/getProducts';
import { PAGES } from '@/app/utils/constants';
import { getSiteUrl } from '@/app/utils/getSiteUrl';

// ISR, one hour, as a literal — segment config cannot be computed.
// Neither `force-static` nor `force-dynamic`: the former without `revalidate`
// freezes the file until the next deploy (product count and section list stay
// as they were at build time), the latter pays request latency for content that
// only changes when an admin edits it.
export const revalidate = 3600;

// Project name for the `#` heading. Deliberately a constant rather than the CMS
// home-page title: that title is a navigation label (`"Home web"`), while the
// spec wants the project name in `H1` — the first thing an assistant quotes.
const SITE_NAME = 'Restaurant';

// Blockquote fallback, used when the home page carries no description.
const FALLBACK_SUMMARY = 'A restaurant chain with online ordering, table reservation and delivery.';

const SITE_URL = getSiteUrl();

/**
 * describe — builds a one-line description of a CMS page for an `llms.txt` item.
 *
 * Reads `plainContent`, trimming anything past 100 characters.
 *
 * @param   {IPagesEntity} page - CMS page entity.
 * @returns Trimmed description, or an empty string when the page has none.
 */
const describe = (page: IPagesEntity): string => {
  const text = page.localizeInfos?.plainContent?.trim() ?? '';
  return text.length > 100 ? `${text.slice(0, 100)}…` : text;
};

/**
 * listPages — renders CMS pages as `- [Title](absolute URL): description` lines.
 *
 * Skips hidden pages and pages without a `pageUrl`, then builds an absolute URL
 * from the route prefix.
 *
 * @param   {IPagesEntity[]} pages  - CMS pages to render.
 * @param   {string}         prefix - Route prefix the pages live under, e.g. `shop`.
 * @returns Markdown list lines.
 */
const listPages = (pages: IPagesEntity[], prefix: string): string[] =>
  pages
    .filter(page => page.isVisible !== false && Boolean(page.pageUrl))
    .map(page => {
      const title = page.localizeInfos?.title ?? page.pageUrl;
      const description = describe(page);
      const url = `${SITE_URL}/${prefix}/${page.pageUrl}`;
      return `- [${title}](${url})${description ? `: ${description}` : ''}`;
    });

/**
 * GET — serves `/llms.txt`, the project map for AI assistants.
 *
 * Fetches the home page, menu categories, restaurants and promotions in
 * parallel, probes the catalogue for its size, then assembles the file per the
 * llmstxt.org structure: one `#` heading, one `>` blockquote, then link
 * sections. Private routes (`/cart`, `/profile`, `/bookings`) are left out —
 * they are disallowed in `robots.ts`, and listing them here would contradict it.
 *
 * @returns Plain-text response with the assembled file.
 * @see {@link https://llmstxt.org llms.txt specification}
 */
export async function GET(): Promise<Response> {
  const [home, categories, restaurants, promotions, catalog] = await Promise.all([
    getPageByUrl(PAGES.home),
    getChildPagesByParentUrl(PAGES.menu),
    getChildPagesByParentUrl(PAGES.restaurants),
    getChildPagesByParentUrl(PAGES.promotions),
    // Only `total` is needed here — a probe, not an export of every product.
    getProducts({ limit: 1, offset: 0 }),
  ]);

  const summary = home.page?.localizeInfos?.plainContent?.trim() || FALLBACK_SUMMARY;

  const lines: string[] = [`# ${SITE_NAME}`, '', `> ${summary}`, ''];

  const categoryPages = categories.pages ?? [];
  if (categoryPages.length > 0) {
    lines.push('## Menu', '', ...listPages(categoryPages, 'shop'), '');
  }

  const restaurantPages = restaurants.pages ?? [];
  if (restaurantPages.length > 0) {
    lines.push('## Restaurants', '', ...listPages(restaurantPages, 'restaurants'), '');
  }

  const promoPages = promotions.pages ?? [];
  if (promoPages.length > 0) {
    lines.push('## Promotions', '', ...listPages(promoPages, 'promotions'), '');
  }

  lines.push(
    '## Information',
    '',
    `- [Full menu](${SITE_URL}/shop): the whole catalogue with filters`,
    `- [Support](${SITE_URL}/support): contacts and the contact form`,
    `- [Sitemap](${SITE_URL}/sitemap.xml): full list of pages`,
    ''
  );

  if (!catalog.isError && catalog.total > 0) {
    lines.push(`Dishes in the catalogue: ${catalog.total}`, '');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
