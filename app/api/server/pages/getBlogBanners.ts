import { getImageUrl } from '@/app/api/api/api';

import { getChildPagesByParentUrl } from './getChildPagesByParentUrl';

/**
 * Normalised promo banner shape used by `HomePromo` (mobile carousel +
 * desktop hero), `CartPromoSidebar`, and the orders-page promo sidebar.
 *
 * - `desktopImage` — `attributeValues.bg_image` (used in 2-col / sidebar
 *   contexts and as a wide hero background);
 * - `mobileImage`  — `attributeValues.banner` (used in narrow
 *   horizontally-scrolled lists);
 * - `pageUrl`      — links to `/promo/<pageUrl>`.
 */
export type BlogBanner = {
  id: number;
  pageUrl: string;
  title: string;
  desktopImage: string | null;
  mobileImage: string | null;
};

/**
 * Fetch all child pages of the OneEntry `blog` page and return them as
 * promo banners with desktop (`bg_image`) and mobile (`banner`) image URLs.
 *
 * Pages without either image are still included — the caller decides which
 * flavour to render and falls back gracefully if the relevant URL is
 * missing.
 * @returns {Promise<BlogBanner[]>} Banner list (empty on CMS error).
 */
export const getBlogBanners = async (): Promise<BlogBanner[]> => {
  const { isError, pages } = await getChildPagesByParentUrl('blog');
  if (isError || !pages) return [];

  type ImageValue =
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | null
    | undefined;

  return pages.map((p) => {
    const attrs = p.attributeValues ?? {};
    const desktopImage =
      getImageUrl(attrs.bg_image?.value as ImageValue) || null;
    const mobileImage = getImageUrl(attrs.banner?.value as ImageValue) || null;
    return {
      id: p.id,
      pageUrl: p.pageUrl ?? '',
      title: p.localizeInfos?.title ?? '',
      desktopImage,
      mobileImage,
    };
  });
};
