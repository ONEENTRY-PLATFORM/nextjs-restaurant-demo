import type { Metadata } from 'next';

import { getSiteUrl } from './getSiteUrl';

/**
 * URL search-param keys that turn a catalog page into a non-canonical (filtered / searched / paginated)
 * view. Keep in sync with the `GridSearchParams` map consumed by `ProductsGridLayout`.
 *
 * Exported because `robots.ts` builds its catalog disallow patterns from this same list — the two have
 * to name the same set of parameters or one of them silently stops matching what the other targets.
 */
export const NON_CANONICAL_PARAMS = [
  'search',
  'page',
  'preferences',
  'filter',
  'minPrice',
  'maxPrice',
  'cooking_time_max',
] as const;

/** Resolved page `searchParams` shape (post-`await`). */
export type ShopSearchParams = Record<string, string | string[] | undefined> | undefined;

/**
 * isFilteredShopView — whether the inbound `searchParams` describe a filtered/searched/paginated catalog
 * view rather than the bare canonical listing.
 *
 * `page=1` (and absent/empty values) count as canonical; anything else flips the view to non-canonical.
 *
 * @param   {ShopSearchParams} searchParams - Resolved page `searchParams` map.
 * @returns `true` when at least one non-canonical filter/search/pagination param is set.
 */
export const isFilteredShopView = (searchParams: ShopSearchParams): boolean => {
  if (!searchParams) return false;
  return NON_CANONICAL_PARAMS.some(key => {
    const value = searchParams[key];
    if (value == null || value === '') return false;
    if (key === 'page') {
      const raw = Array.isArray(value) ? value[0] : value;
      return Number(raw) > 1;
    }
    return Array.isArray(value) ? value.length > 0 : true;
  });
};

/**
 * shopCrawlMeta — robots/canonical overlay for catalog pages. Keeps the bare listing indexable while
 * de-indexing filtered/paginated variants (crawl-budget hygiene) and canonicalising every variant to the
 * clean path, so faceted query-string URLs neither fragment the index nor get crawled into compute.
 *
 * The `index: false` branch is defence in depth, not the primary mechanism: `robots.ts` blocks the same
 * URLs outright, and a compliant crawler therefore never fetches them to read this `noindex`. It earns
 * its place against the crawlers that ignore robots.txt — the ones that caused the compute spike.
 *
 * @param   {object}           options               - Overlay options.
 * @param   {ShopSearchParams} options.searchParams  - Resolved page `searchParams` map.
 * @param   {string}           options.canonicalPath - Clean route path without query, e.g. `/shop/category/pizza`.
 * @param   {boolean}          [options.isVisible]   - Whether the CMS page itself is indexable (defaults to `true`).
 * @returns A `Pick<Metadata, 'robots' | 'alternates'>` overlay to merge into the page metadata.
 */
export const shopCrawlMeta = ({
  searchParams,
  canonicalPath,
  isVisible = true,
}: {
  searchParams: ShopSearchParams;
  canonicalPath: string;
  isVisible?: boolean;
}): Pick<Metadata, 'robots' | 'alternates'> => {
  const base = getSiteUrl();
  const index = isVisible && !isFilteredShopView(searchParams);

  return {
    robots: {
      index,
      follow: true,
      googleBot: { index, follow: true },
    },
    alternates: { canonical: `${base}${canonicalPath}` },
  };
};
