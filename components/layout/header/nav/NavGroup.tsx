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
 * NavGroup — группа верхней навигации (Home/Cart/Favorites/Profile + generic-пункты CMS-меню `user_menu`).
 *
 * Fallback: если меню не пришло — рисуем дефолтный набор иконок.
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
          // Фоллбек: меню не пришло — дефолтный набор иконок.
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
      // У страницы Home нет `menu_icon` в CMS — используем встроенный `HouseIcon`.
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

/** Generic-ссылка для верхнего меню — иконка из `attributeValues.menu_icon`. */
const NavGenericIcon = ({ page }: { page: IMenusPages }): JSX.Element | null => {
  // SDK типизирует `menu_icon.value` как `{}`, но для image приходит `{ downloadLink, ... }`.
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
