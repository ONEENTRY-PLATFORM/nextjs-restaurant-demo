import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import getBannerBlurMap from '@/app/api/lqip/getBannerBlurMap';

import HomePromoCarousel from './HomePromoCarousel';
import HomePromoOverlay from './HomePromoOverlay';

/**
 * HomePromo — homepage promo strip (desktop carousel + horizontal scroll for mobile).
 *
 * Entrance animation is done by a solid-black overlay that fades from opacity:1 → 0 over the banners (`.home-promo-overlay` in `main.css`, 0.5 s delay + 0.5 s duration). The hero `<img>` itself never animates opacity, so Chrome's LCP heuristic still picks it up at the first paint — visual fade-in without LCP regression. Chrome ignores visual occlusion by sibling elements when computing LCP candidacy, so the overlay is "free".
 *
 * The desktop strip rotates through every promo page (`blog` child pages) that has a desktop image via the client `HomePromoCarousel`; the server keeps the data fetch + LQIP generation and hands the carousel a plain `{ id: blur }` map (the `BannerBlur` type lives in a `server-only` module and must not cross into the client).
 *
 * `getBannerBlurMap` is imported via its direct path (not the `@/app/api` barrel) because `sharp` is Node-only and the barrel reaches the client bundle.
 *
 * @returns Promise resolving to JSX of the promo strip, or `null` when no banners are configured.
 */
const HomePromo = async (): Promise<JSX.Element | null> => {
  const banners = await getBlogBanners();
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

  return (
    <div className="relative">
      <HomePromoOverlay />
      {desktopBanners.length > 0 ? (
        <div className="section_layout hidden md:block pt-0">
          <HomePromoCarousel banners={desktopBanners} blur={desktopBlur} />
        </div>
      ) : null}

      {mobileBanners.length > 0 ? (
        <section className="md:hidden pt-3">
          <h2 className="title_name mx-auto md:hidden px-4">Promotions</h2>
          <div className="flex overflow-x-auto overflow-y-hidden max-w-full gap-2.5 mt-3.75 no-scrollbar">
            {mobileBanners.map(b => {
              const mobileBlur = blurMap[b.id]?.mobile;
              return (
                <Link
                  key={b.id}
                  href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
                  title={b.title}
                  className="w-86.75 h-36.25 shrink-0 object-cover relative"
                >
                  <Image
                    src={b.mobileImage as string}
                    alt={b.title}
                    fill
                    sizes="347px"
                    className="object-cover"
                    {...(mobileBlur
                      ? { placeholder: 'blur' as const, blurDataURL: mobileBlur }
                      : {})}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default HomePromo;
