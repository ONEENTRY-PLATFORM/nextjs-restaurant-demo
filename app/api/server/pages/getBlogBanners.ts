import type { IError, IPagesEntity } from 'oneentry/types';
import { cache } from 'react';

import { PAGES } from '@/app/utils/constants';

import { getChildPagesByParentUrl } from './getChildPagesByParentUrl';

type BlogBannersResult = {
  isError: boolean;
  error?: IError;
  pages?: IPagesEntity[];
};

/**
 * getBlogBanners — child pages of `promotions` used as promo banners, sorted by `position`.
 *
 * Returns the SDK page entities untouched (sort only) — banner image URLs are resolved at the
 * point of use via `blogBannerFromPage` (`components/promo/blogBanner.ts`).
 *
 * @returns Promise resolving to `{ isError, error?, pages? }` (graceful fallback on SDK error).
 */
export const getBlogBanners = cache(async (): Promise<BlogBannersResult> => {
  const { isError, error, pages } = await getChildPagesByParentUrl(PAGES.promotions);
  if (isError || !pages) {
    return { isError: true, ...(error ? { error } : {}) };
  }
  return {
    isError: false,
    pages: [...pages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  };
});
