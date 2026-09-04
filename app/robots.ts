import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/app/utils/getSiteUrl';
import { NON_CANONICAL_PARAMS } from '@/app/utils/shopCrawlMeta';

/*
  One pattern per faceting parameter, rather than one pattern per query string.

  The previous `/shop?` + `/shop/*?` pair blocked *any* query string anywhere under `/shop` — and
  product pages live at `/shop/product/<id>`. So a product link that picked up a tracking parameter
  on the way (`?fbclid=…` is appended by Facebook to every shared link, and campaign links carry
  `utm_*`) became uncrawlable: the crawler never fetched it, therefore never saw the canonical that
  would have folded it back onto the clean URL.

  Derived from `NON_CANONICAL_PARAMS` so the block and the `noindex` in `shopCrawlMeta` cannot drift
  apart. `*` is the wildcard Google honours, so `/shop*?*search=` covers the root catalog, category
  listings and single-handle listings alike, at any position in the query string.
*/
const FACET_PATTERNS = NON_CANONICAL_PARAMS.map(param => `/shop*?*${param}=`);

/**
 * robots — site crawler directives.
 *
 * Blocks faceted/paginated catalog URLs so crawlers stop hammering Vercel compute with combinatorial
 * query combinations, and disallows private/non-indexable areas (profile, cart, auth, API). Canonical
 * catalog, category and product pages stay crawlable — including when they carry a tracking parameter;
 * the sitemap lists every category, restaurant and product directly, so nothing depends on a crawler
 * walking the paginated listings.
 *
 * Note this makes the `index: false` half of {@link shopCrawlMeta} unreachable for a compliant crawler:
 * a blocked URL is never fetched, so its `noindex` is never read. That is deliberate — robots.txt is
 * the cheaper lever, and the `noindex` remains as defence against the crawlers that ignore robots.txt,
 * which are the ones that caused the compute spike in the first place.
 *
 * @returns The `robots.txt` ruleset for the site.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...FACET_PATTERNS, '/profile', '/cart', '/auth/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
