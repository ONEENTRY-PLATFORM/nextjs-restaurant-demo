import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import type { BlogBanner } from '@/app/api';

/**
 * Desktop-only promo sidebar shown next to the cart (port of the right
 * column of `static-html/pk_cart.html`). Driven by OneEntry `blog` child
 * pages — uses `attributeValues.bg_image` per page (desktop variant of
 * each banner).
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
  const items = banners.filter((b) => b.desktopImage);
  if (items.length === 0) return null;

  return (
    <aside className="hidden w-1/2 flex-col gap-10 md:flex">
      {items.map((b) => (
        <Link
          key={b.id}
          href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
          title={b.title}
          className="block overflow-hidden rounded-[10px] transition-transform duration-500 hover:scale-[1.02]"
        >
          <Image
            src={b.desktopImage as string}
            alt={b.title}
            width={615}
            height={278}
            className="h-auto w-full"
          />
        </Link>
      ))}
    </aside>
  );
};

export default CartPromoSidebar;
