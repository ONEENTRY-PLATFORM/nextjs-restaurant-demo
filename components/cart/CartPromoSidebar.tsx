import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import type { BlogBanner } from '@/app/api';

import PromoBannerAnimations from './animations/PromoBannerAnimations';

/**
 * Desktop-only promo sidebar shown next to the cart (port of the right
 * column of `static-html/pk_cart.html`). Driven by OneEntry `blog` child
 * pages — uses `attributeValues.banner` (mobile/portrait variant), which
 * matches the stacked column shape in the verstka. The wide `bg_image`
 * variant is reserved for the home-page hero only.
 *
 * Banner data is fetched server-side (`getBlogBanners`) and passed down
 * because the parent `CartWizard` is a client component.
 * @param   {object}        props         - Sidebar props.
 * @param   {BlogBanner[]}  props.banners - CMS-driven banner list.
 * @returns {JSX.Element}                 Sidebar JSX.
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
