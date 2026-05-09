import Image from 'next/image';
import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import { getMenuByMarker } from '@/app/api';
import HouseIcon from '@/components/icons/house';

import NavItemCart from './NavItemCart';
import NavItemFavorites from './NavItemFavorites';
import NavItemProfile from './NavItemProfile';

/**
 * NavGroup — top navigation group (Home/Cart/Favorites/Profile + generic items from the `user_menu` CMS menu).
 *
 * Fallback: if the menu did not load, render the default icon set.
 */
const NavGroup = async (): Promise<JSX.Element> => {
  const { menu } = await getMenuByMarker('user_menu');
  const topLevel = (menu?.pages ?? [])
    .filter(p => p.parentId === null)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div className="flex justify-between relative self-end cursor-pointer">
      <div className="gap-8 max-md:gap-6 max-sm:gap-4 flex">
        {topLevel.length === 0 ? (
          // Fallback: menu did not load — default icon set.
          <>
            <NavItemCart />
            <NavItemFavorites />
            <NavItemProfile />
          </>
        ) : (
          topLevel.map(page => renderItem(page))
        )}
      </div>
    </div>
  );
};

const renderItem = (page: IMenusPages): JSX.Element | null => {
  switch (page.pageUrl) {
    case 'home_web':
      // The Home page has no `menu_icon` in the CMS — fall back to the built-in `HouseIcon`.
      return (
        <Link
          key={page.id}
          prefetch={false}
          href="/"
          aria-label={page.localizeInfos?.menuTitle ?? page.localizeInfos?.title ?? 'Home'}
          className="group relative my-auto box-border flex shrink-0"
        >
          <HouseIcon size="lg" />
        </Link>
      );
    case 'cart':
      return <NavItemCart key={page.id} />;
    case 'favorites':
      return <NavItemFavorites key={page.id} />;
    case 'profile':
      return <NavItemProfile key={page.id} />;
    default:
      return <NavGenericIcon key={page.id} page={page} />;
  }
};

/** Generic top-menu link — icon from `attributeValues.menu_icon`. */
const NavGenericIcon = ({ page }: { page: IMenusPages }): JSX.Element | null => {
  // SDK types `menu_icon.value` as `{}`, but for an image it actually arrives as `{ downloadLink, ... }`.
  const icon = page.attributeValues?.menu_icon as
    | { type?: string; value?: { downloadLink?: string } }
    | undefined;
  const iconUrl = icon?.type === 'image' ? icon.value?.downloadLink : undefined;
  if (!iconUrl) return null;

  const title = page.localizeInfos?.menuTitle ?? page.localizeInfos?.title ?? page.pageUrl ?? '';
  const href = page.pageUrl === 'home_web' ? '/' : `/${page.pageUrl}`;

  return (
    <Link
      prefetch={false}
      href={href}
      title={title}
      aria-label={title}
      className="group relative my-auto box-border flex size-6 shrink-0"
    >
      <Image
        src={iconUrl}
        alt=""
        width={24}
        height={24}
        className="object-contain hover-target"
        unoptimized
      />
    </Link>
  );
};

export default NavGroup;
