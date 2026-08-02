import Image from 'next/image';
import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import { getMenuByMarker } from '@/app/api';
import { MENUS, PAGES } from '@/app/utils/constants';
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
  const { menu } = await getMenuByMarker(MENUS.userMenu);
  const topLevel = (menu?.pages ?? [])
    .filter(p => p.parentId === null)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    // `z-60` — keep nav drop-downs (e.g. profile sub-menu) above the search
    // row, which sits in its own `z-50` stacking context below.
    <div className="relative z-60 flex cursor-pointer justify-between self-end">
      <div data-header-anim="top-nav" className="flex gap-8 max-md:gap-6 max-sm:gap-4">
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
    case PAGES.home:
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
    case PAGES.cart:
      return <NavItemCart key={page.id} />;
    case PAGES.favorites:
      return <NavItemFavorites key={page.id} />;
    case PAGES.profile:
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
  // SDK types `menu_icon.value` as `{}`. For Pages the SDK actually returns an ARRAY of image
  // objects (groupOfImages-style normalization), so we unwrap the first element.
  const icon = page.attributeValues?.menu_icon as
    | {
        type?: string;
        value?: { downloadLink?: string } | Array<{ downloadLink?: string }> | null;
      }
    | undefined;
  const iconValue = icon?.value;
  const iconUrl =
    icon?.type === 'image'
      ? Array.isArray(iconValue)
        ? iconValue[0]?.downloadLink
        : iconValue?.downloadLink
      : undefined;
  if (!iconUrl) return null;

  const title = page.localizeInfos?.menuTitle ?? page.localizeInfos?.title ?? page.pageUrl ?? '';
  const href = page.pageUrl === PAGES.home ? '/' : `/${page.pageUrl}`;

  return (
    <Link
      href={href}
      prefetch={false}
      title={title}
      aria-label={title}
      className="group relative my-auto box-border flex size-6 shrink-0"
    >
      <Image
        src={iconUrl}
        alt=""
        width={24}
        height={24}
        className="hover-target object-contain"
        unoptimized
      />
    </Link>
  );
};

export default NavGroup;
