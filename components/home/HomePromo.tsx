import type { JSX } from 'react';

import getBannerBlurMap from '@/app/api/lqip/getBannerBlurMap';
import { getBlogBanners } from '@/app/api/server/pages/getBlogBanners';
import { t } from '@/app/dictionaries';
import { blogBannerFromPage } from '@/components/promo/blogBanner';

import HomePromoCarousel from './HomePromoCarousel';
import HomePromoOverlay from './HomePromoOverlay';

/**
 * HomePromo — homepage promo strip: one Swiper carousel per breakpoint (desktop full-width, mobile peeking cards).
 *
 * @returns Promise resolving to JSX of the promo strip, or `null` when no banners are configured.
 */
const HomePromo = async (): Promise<JSX.Element | null> => {
  const { pages } = await getBlogBanners();
  const banners = (pages ?? []).map(blogBannerFromPage);
  const desktopBanners = banners.filter(b => b.desktopImage);
  const mobileBanners = banners.filter(b => b.mobileImage);

  if (desktopBanners.length === 0 && mobileBanners.length === 0) return null;

  // Dedupe by id — a banner can carry both a desktop and a mobile image.
  const blurInput = Array.from(
    new Map([...desktopBanners, ...mobileBanners].map(b => [b.id, b])).values()
  );
  const blurMap = await getBannerBlurMap(blurInput);
  const desktopBlur: Record<number, string | null> = Object.fromEntries(
    desktopBanners.map(b => [b.id, blurMap[b.id]?.desktop ?? null])
  );
  const mobileBlur: Record<number, string | null> = Object.fromEntries(
    mobileBanners.map(b => [b.id, blurMap[b.id]?.mobile ?? null])
  );

  const promotionsTitle = await t('promotions_title', 'Promotions');

  return (
    <div className="relative">
      <HomePromoOverlay />
      {desktopBanners.length > 0 ? (
        <div className="section_layout hidden pt-0 md:block">
          <HomePromoCarousel variant="desktop" banners={desktopBanners} blur={desktopBlur} />
        </div>
      ) : null}

      {mobileBanners.length > 0 ? (
        <section className="pt-3 md:hidden">
          <h2 className="title_name mx-auto px-4">{promotionsTitle}</h2>
          <div className="mt-3.75">
            <HomePromoCarousel variant="mobile" banners={mobileBanners} blur={mobileBlur} />
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default HomePromo;
