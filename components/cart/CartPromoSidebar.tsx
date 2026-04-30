import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import type { BlogBanner } from '@/app/api';

import PromoBannerAnimations from './animations/PromoBannerAnimations';

/**
 * Промо-сайдбар только для десктопа, показывается рядом с корзиной (порт правой
 * колонки `static-html/pk_cart.html`). Управляется дочерними страницами
 * `blog` из OneEntry — использует `attributeValues.banner` (mobile/portrait вариант),
 * что совпадает с формой стаканной колонки в верстке. Широкий вариант `bg_image`
 * зарезервирован только для hero на главной.
 *
 * Данные баннеров фетчатся на сервере (`getBlogBanners`) и пробрасываются вниз,
 * потому что родительский `CartWizard` — клиентский компонент.
 * @param   {object}        props         - Пропсы сайдбара.
 * @param   {BlogBanner[]}  props.banners - Список баннеров из CMS.
 * @returns {JSX.Element}                 JSX сайдбара.
 */
const CartPromoSidebar = ({
  banners,
}: {
  banners: BlogBanner[];
}): JSX.Element | null => {
  const items = banners.filter((b) => b.mobileImage);
  if (items.length === 0) return null;

  return (
    <aside className="hidden w-1/2 flex-col gap-10 md:flex">
      {items.map((b, i) => (
        <PromoBannerAnimations key={b.id} index={i}>
          <Link
            href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
            title={b.title}
            className="block overflow-hidden rounded-[10px] transition-transform duration-500 hover:scale-[1.02]"
          >
            <Image
              src={b.mobileImage as string}
              alt={b.title}
              width={615}
              height={278}
              className="h-auto w-full"
            />
          </Link>
        </PromoBannerAnimations>
      ))}
    </aside>
  );
};

export default CartPromoSidebar;
