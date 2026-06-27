import { cache } from 'react';

import { getImageUrl } from '@/app/api/api/api';
import { PAGES } from '@/app/utils/constants';

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
 * @returns Banner list (empty on CMS error).
 */
export const getBlogBanners = cache(async (): Promise<BlogBanner[]> => {
  const { isError, pages } = await getChildPagesByParentUrl(PAGES.blog);
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
