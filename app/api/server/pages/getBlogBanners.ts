import { cache } from 'react';

import { getImageUrl } from '@/app/api/api/api';

import { getChildPagesByParentUrl } from './getChildPagesByParentUrl';

/** BlogBanner — normalised promo banner (HomePromo, CartPromoSidebar, orders promo sidebar). */
export type BlogBanner = {
  id: number;
  pageUrl: string;
  title: string;
  desktopImage: string | null;
  mobileImage: string | null;
};

/**
 * getBlogBanners — child pages of `blog` rendered as promo banners with desktop/mobile images.
 *
 * Manually sorts results by `position`. LQIP previews are NOT bundled in here — `sharp`/`lqip-modern` are Node-only and this fetcher is re-exported via the `@/app/api` barrel, which client code imports. Call `getBlogBannerBlurMap(banners)` from a server component to attach blur previews.
 *
 * @returns Banner list (empty on CMS error).
 */
export const getBlogBanners = cache(async (): Promise<BlogBanner[]> => {
  const { isError, pages } = await getChildPagesByParentUrl('blog');
  if (isError || !pages) return [];

  type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

  const sorted = [...pages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return sorted.map(p => {
    const attrs = p.attributeValues ?? {};
    const desktopImage = getImageUrl(attrs.bg_image?.value as ImageValue) || null;
    const mobileImage = getImageUrl(attrs.banner?.value as ImageValue) || null;
    return {
      id: p.id,
      pageUrl: p.pageUrl ?? '',
      title: p.localizeInfos?.title ?? '',
      desktopImage,
      mobileImage,
    };
  });
});
