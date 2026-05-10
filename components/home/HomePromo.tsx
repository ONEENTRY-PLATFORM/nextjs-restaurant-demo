import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';

/**
 * HomePromo — homepage promo strip (desktop hero + horizontal scroll for mobile).
 *
 * Driven by `blog` children from OneEntry.
 *
 * @returns {Promise<JSX.Element | null>} JSX of the promo strip, or `null` when no banners are configured.
 */
const HomePromo = async (): Promise<JSX.Element | null> => {
  const banners = await getBlogBanners();
  const heroBanner = banners.find(b => b.desktopImage) ?? null;
  const mobileBanners = banners.filter(b => b.mobileImage);

  if (!heroBanner && mobileBanners.length === 0) return null;

  return (
    <>
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
            />
          </Link>
        </div>
      ) : null}

      {mobileBanners.length > 0 ? (
        <section className="md:hidden pt-3">
          <h2 className="title_name mx-auto md:hidden px-4">Promotions</h2>
          <div className="flex overflow-x-auto overflow-y-hidden max-w-full gap-2.5 mt-3.75 no-scrollbar">
            {mobileBanners.map(b => (
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
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
};

export default HomePromo;
