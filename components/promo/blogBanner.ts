import type { IPagesEntity } from 'oneentry/types';

import { getImageUrl } from '@/app/api/api/api';

/** BlogBanner — promo-banner view model (HomePromo, CartPromoSidebar, orders promo sidebar). */
export type BlogBanner = {
  id: number;
  pageUrl: string;
  title: string;
  desktopImage: string | null;
  mobileImage: string | null;
};

type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

/**
 * blogBannerFromPage — maps a OneEntry promotion page onto the `BlogBanner` view model.
 *
 * Reads the page `bg_image` (desktop) and `banner` (mobile) image attributes via `getImageUrl`.
 *
 * @param   {IPagesEntity} page - Promotion child page from `getBlogBanners`.
 * @returns Banner view model consumed by the promo components.
 */
export const blogBannerFromPage = (page: IPagesEntity): BlogBanner => {
  const attrs = page.attributeValues ?? {};
  return {
    id: page.id,
    pageUrl: page.pageUrl ?? '',
    title: page.localizeInfos?.title ?? '',
    desktopImage: getImageUrl(attrs.bg_image?.value as ImageValue) || null,
    mobileImage: getImageUrl(attrs.banner?.value as ImageValue) || null,
  };
};
