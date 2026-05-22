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
 *
 * @returns JSX of the top navigation icon row.
 */
const NavGroup = async (): Promise<JSX.Element> => {
  const { menu } = await getMenuByMarker('user_menu');
  const topLevel = (menu?.pages ?? [])
    .filter(p => p.parentId === null)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    // `z-60` — keep nav drop-downs (e.g. profile sub-menu) above the search
    // row, which sits in its own `z-50` stacking context below.
    <div className="flex justify-between relative z-60 self-end cursor-pointer">
      <div data-header-anim="top-nav" className="gap-8 max-md:gap-6 max-sm:gap-4 flex">
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

/**
 * renderItem — dispatches a single menu page to the right nav-item component.
 *
 * @param   {IMenusPages} page - OneEntry menu page entity.
 * @returns JSX for the matching nav item, or `null` when the page is unknown.
 */
const renderItem = (page: IMenusPages): JSX.Element | null => {
  switch (page.pageUrl) {
    case 'home_web':
      // The Home page has no `menu_icon` in the CMS — fall back to the built-in `HouseIcon`.
      return (
        <Link
          key={page.id}
          href="/"
          prefetch={false}
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

/**
 * NavGenericIcon — generic top-menu link rendering the icon from `attributeValues.menu_icon`.
 *
 * @param   {object}      props      - Component props.
 * @param   {IMenusPages} props.page - OneEntry menu page entity (only `menu_icon` and `pageUrl` are read).
 * @returns JSX of the generic nav link, or `null` when no icon is configured.
 */
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
