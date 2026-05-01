import Image from 'next/image';
import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import { getMenuByMarker } from '@/app/api';
import HouseIcon from '@/components/icons/house';

import MenuButton from './MenuButton';
import NavItemCart from './NavItemCart';
import NavItemFavorites from './NavItemFavorites';
import NavItemProfile from './NavItemProfile';

/**
 * Группа пользовательской навигации (верхняя панель иконок: Home, Cart,
 * Favorites, Profile). Состав и порядок берутся из CMS-меню `user_menu`
 * — top-level entries (`parentId === null`), отсортированные по
 * `position`.
 *
 * Сопоставление `pageUrl → компонент`:
 *  - `cart` → {@link NavItemCart} (ссылка с бейджем количества)
 *  - `favorites` → {@link NavItemFavorites} (ссылка с бейджем)
 *  - `profile` → {@link NavItemProfile} (иконка с hover-дропдауном
 *    из children пункта `profile` в `user_menu`)
 *  - любая другая → generic-ссылка с иконкой из
 *    `attributeValues.menu_icon` (атрибут типа `image`) и href
 *    `/${pageUrl}`. Если `menu_icon` не задан — пункт пропускается,
 *    чтобы не выводить пустую кнопку.
 *
 * Если меню не получено (ошибка SDK или маркера ещё нет) — fallback
 * на `[Home, Cart, Favorites, Profile]` хардкодом, чтобы хедер не
 * рассыпался.
 */
const NavGroup = async (): Promise<JSX.Element> => {
  const { menu } = await getMenuByMarker('user_menu');
  const topLevel = (menu?.pages ?? [])
    .filter((p) => p.parentId === null)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div className="flex justify-between relative self-end cursor-pointer">
      <div className="gap-8 max-md:gap-6 max-sm:gap-4 flex">
        {topLevel.length === 0 ? (
          // Фоллбек: меню не пришло — рисуем дефолтный набор иконок,
          // чтобы юзер не остался без навигации.
          <>
            <NavItemCart />
            <NavItemFavorites />
            <NavItemProfile />
          </>
        ) : (
          topLevel.map((page) => renderItem(page))
        )}
      </div>
      <MenuButton />
    </div>
  );
};

const renderItem = (page: IMenusPages): JSX.Element | null => {
  switch (page.pageUrl) {
    case 'home_web':
      // Home — у CMS-страницы пустой `attributeValues`, иконки в `menu_icon`
      // нет, поэтому используем встроенный `HouseIcon` (тот же, что был
      // до перевода NavGroup на CMS-меню).
      return (
        <Link
          key={page.id}
          prefetch={false}
          href="/"
          aria-label={
            page.localizeInfos?.menuTitle ?? page.localizeInfos?.title ?? 'Home'
          }
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
 * Generic-ссылка для верхнего меню — рендерит иконку из
 * `attributeValues.menu_icon`. Используется для всех top-level пунктов,
 * у которых нет специализированного компонента (Home, etc.).
 */
const NavGenericIcon = ({
  page,
}: {
  page: IMenusPages;
}): JSX.Element | null => {
  // `attributeValues.menu_icon.value` в SDK типизирован как `{}` — данные
  // приходят как `{ downloadLink, ... }` для type === 'image' (см.
  // inspect-api). Сужаем локальным cast'ом.
  const icon = page.attributeValues?.menu_icon as
    | { type?: string; value?: { downloadLink?: string } }
    | undefined;
  const iconUrl = icon?.type === 'image' ? icon.value?.downloadLink : undefined;
  if (!iconUrl) return null;

  const title =
    page.localizeInfos?.menuTitle ??
    page.localizeInfos?.title ??
    page.pageUrl ??
    '';
  // pageUrl `home_web` (как в админке) → ведёт на корень сайта;
  // остальные — на `/${pageUrl}`.
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
