import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import getBannerBlurMap from '@/app/api/lqip/getBannerBlurMap';

import HomePromoOverlay from './HomePromoOverlay';

/**
 * HomePromo — homepage promo strip (desktop hero + horizontal scroll for mobile).
 *
 * Entrance animation is done by a solid-black overlay that fades from opacity:1 → 0 over the banners (`.home-promo-overlay` in `main.css`, 0.5 s delay + 0.5 s duration). The hero `<img>` itself never animates opacity, so Chrome's LCP heuristic still picks it up at the first paint — visual fade-in without LCP regression. Chrome ignores visual occlusion by sibling elements when computing LCP candidacy, so the overlay is "free".
 *
 * `getBannerBlurMap` is imported via its direct path (not the `@/app/api` barrel) because `sharp` is Node-only and the barrel reaches the client bundle.
 *
 * @returns Promise resolving to JSX of the promo strip, or `null` when no banners are configured.
 */
const HomePromo = async (): Promise<JSX.Element | null> => {
  const banners = await getBlogBanners();
  const heroBanner = banners.find(b => b.desktopImage) ?? null;
  const mobileBanners = banners.filter(b => b.mobileImage);

  if (!heroBanner && mobileBanners.length === 0) return null;

  const blurMap = await getBannerBlurMap([...(heroBanner ? [heroBanner] : []), ...mobileBanners]);
  const heroBlur = heroBanner ? blurMap[heroBanner.id]?.desktop : null;

  return (
    <div className="relative">
      <HomePromoOverlay />
      {heroBanner ? (
        <div className="section_layout hidden md:flex pt-0">
          <Link
            href={heroBanner.pageUrl ? `/promo/${heroBanner.pageUrl}` : '#'}
            title={heroBanner.title}
            className="block w-full overflow-hidden rounded-panel transition-transform duration-500 hover:scale-[1.01]"
          >
            <Image
              src={heroBanner.desktopImage as string}
              alt={heroBanner.title}
              width={1292}
              height={192}
              priority
              sizes="(min-width: 1280px) 1292px, (min-width: 1024px) 1000px, 700px"
              className="h-auto w-full object-cover"
              {...(heroBlur ? { placeholder: 'blur' as const, blurDataURL: heroBlur } : {})}
            />
          </Link>
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
