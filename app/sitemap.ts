import type { MetadataRoute } from 'next';

import { getChildPagesByParentUrl, getProducts } from '@/app/api';
import { PAGES } from '@/app/utils/constants';
import { getSiteUrl } from '@/app/utils/getSiteUrl';

export const dynamic = 'force-static';
export const revalidate = 3600;

/** Canonical static content routes (path segments appended to the site origin). */
const STATIC_PATHS = ['', '/shop', '/service', '/promotions', '/support', '/restaurants'] as const;

/**
 * sitemap — XML sitemap of canonical, indexable URLs only.
 *
 * Lists the static content routes plus CMS-driven category pages (`/shop/category/<handle>`), restaurant
 * detail pages (`/restaurants/<handle>`) and product pages (`/shop/product/<id>`). Faceted/paginated
 * query-string variants are intentionally excluded (they are disallowed in `robots.ts` and de-indexed via
 * canonical). Each remote fetch is wrapped so a single OneEntry hiccup degrades gracefully to fewer URLs.
 *
 * @returns Promise resolving to the sitemap entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(path => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8,
  }));

  // Menu categories → /shop/category/<pageUrl>
  try {
    const { pages } = await getChildPagesByParentUrl(PAGES.menu);
    for (const category of pages ?? []) {
      if (category?.isVisible === false || !category?.pageUrl) continue;
      entries.push({
        url: `${base}/shop/category/${category.pageUrl}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    /* graceful: skip categories on fetch error */
  }

  // Restaurant detail pages → /restaurants/<pageUrl>
  try {
    const { pages } = await getChildPagesByParentUrl(PAGES.restaurants);
    for (const restaurant of pages ?? []) {
      if (restaurant?.isVisible === false || !restaurant?.pageUrl) continue;
      entries.push({
        url: `${base}/restaurants/${restaurant.pageUrl}`,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  } catch {
    /* graceful: skip restaurants on fetch error */
  }

  // Product detail pages → /shop/product/<id>
  try {
    const { products } = await getProducts({ offset: 0, limit: 1000 });
    for (const product of products ?? []) {
      if (product?.isVisible === false) continue;
      entries.push({
        url: `${base}/shop/product/${product.id}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    /* graceful: skip products on fetch error */
  }

  return entries;
}
