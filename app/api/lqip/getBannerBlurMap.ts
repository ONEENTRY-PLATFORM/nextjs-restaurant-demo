import 'server-only';

import getLqipPreview from '@/app/api/lqip/getLqipPreview';

type BannerLike = {
  id: number;
  desktopImage: string | null;
  mobileImage: string | null;
};

/** Per-banner LQIP previews. */
export type BannerBlur = {
  /** base64 LQIP for `desktopImage`. */
  desktop: string | null;
  /** base64 LQIP for `mobileImage`. */
  mobile: string | null;
};

/**
 * getBannerBlurMap — base64 LQIP previews for an array of promo banners keyed by `banner.id`.
 *
 * Generates desktop and mobile previews in parallel via `getLqipPreview` (which already memoises per URL).
 *
 * Kept out of the `@/app/api` barrel: `lqip-modern`/`sharp` are Node-only and that barrel is imported by client code (`app/store/store.ts`).
 *
 * @param   {BannerLike[]} banners - Banner records with desktop/mobile image URLs.
 * @returns Promise resolving to `{ [bannerId]: { desktop, mobile } }`.
 */
const getBannerBlurMap = async (banners: BannerLike[]): Promise<Record<number, BannerBlur>> => {
  const entries = await Promise.all(
    banners.map(async b => {
      const [desktop, mobile] = await Promise.all([
        b.desktopImage ? getLqipPreview(b.desktopImage) : Promise.resolve(null),
        b.mobileImage ? getLqipPreview(b.mobileImage) : Promise.resolve(null),
      ]);
      return [b.id, { desktop, mobile }] as const;
    })
  );
  return Object.fromEntries(entries);
};

export default getBannerBlurMap;
