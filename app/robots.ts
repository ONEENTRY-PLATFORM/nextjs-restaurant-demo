import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/app/utils/getSiteUrl';

/**
 * robots — site crawler directives.
 *
 * Blocks faceted/paginated catalog URLs (any `/shop` variant carrying a query string — filter, search,
 * price, page) so crawlers stop hammering Vercel compute with combinatorial query combinations, and
 * disallows private/non-indexable areas (profile, cart, auth, API). Canonical catalog, category, and
 * product pages stay crawlable; the sitemap points bots at them.
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
        disallow: [
          '/shop?', // filtered/paginated root catalog (query string present)
          '/shop/*?', // filtered/paginated category & single-handle catalogs
          '/profile',
          '/cart',
          '/auth/',
          '/api/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
