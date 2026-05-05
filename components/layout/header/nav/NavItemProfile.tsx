'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useContext, useMemo, useState } from 'react';

import { useGetMenuByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ProfileIcon from '@/components/icons/profile';

import LogoutMenuItem from './user-menu/LogoutMenuItem';

/**
 * Иконка профиля в верхнем меню навигации.
 *
 * - **Не авторизован** → клик открывает SignInForm в общей `Modal`.
 * - **Авторизован** → клик ведёт на `/profile` (страница Personal),
 *   а наведение мышкой раскрывает выпадающее подменю с дочерними
 *   пунктами CMS-меню `user_menu`, привязанными к странице `profile`
 *   (Orders, Bookings и т.п.) + `<LogoutMenuItem />`.
 *
 * Маркер CMS — `user_menu`. Под `profile` (entry с
 * `pageUrl === 'profile'`) в админке заведены sub-страницы как
 * children: их `parentId` равен id этого entry. Их URL'ы строятся как
 * `/profile/${pageUrl}` — соответствует структуре `app/profile/{...}`.
 *
 * Подменю появляется на `pointerenter` всей обёртки и скрывается на
 * `pointerleave` — типичный hover-pattern для desktop-навигации
 * (touch-устройства open/close через тап по другому пункту, потому что
 * сам Profile-пункт — это `<Link>`, а не toggle).
 */
const PROFILE_MENU_MARKER = 'user_menu';
const PROFILE_PAGE_URL = 'profile';

const NavItemProfile = (): JSX.Element => {
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);
  const { isAuth } = useContext(AuthContext);

  const [hoverOpen, setHoverOpen] = useState(false);

  const { data: menu } = useGetMenuByMarkerQuery(
    { marker: PROFILE_MENU_MARKER },
    { skip: !isAuth }
  );

  // Children пункта `profile` в `user_menu` — то, что должно быть
  // в подменю. Сортируем по `position`.
  const profileChildren = useMemo<IMenusPages[]>(() => {
    const pages = menu?.pages ?? [];
    const profileEntry = pages.find(p => p.pageUrl === PROFILE_PAGE_URL);
    if (!profileEntry) return [];
    return pages
      .filter(p => p.parentId === profileEntry.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [menu]);

  const handleGuestClick = () => {
    setComponent('AuthProviderSelect');
    setOpen(!open);
  };

  if (!isAuth) {
    return (
      <button
        onClick={handleGuestClick}
        className="group relative my-auto box-border flex size-6 shrink-0 cursor-pointer"
        aria-label="Sign In"
      >
        <ProfileIcon />
      </button>
    );
  }

  return (
    <div
      className="relative flex"
      onPointerEnter={() => setHoverOpen(true)}
      onPointerLeave={() => setHoverOpen(false)}
    >
      <Link
        href="/profile"
        prefetch={false}
        className="group relative my-auto box-border flex size-6 shrink-0"
        aria-label="Profile"
      >
        <ProfileIcon />
      </Link>
      {hoverOpen && (profileChildren.length > 0 || isAuth) ? (
        <ul
          role="menu"
          // Подвешиваем подменю под иконкой; небольшой gap через `pt-2`
          // обеспечивает, что курсор продолжает hover-зону при переходе
          // между иконкой и подменю (без `pt-2` mouse leaves wrapper).
          className="absolute right-0 top-6 z-30 w-48 pt-2"
        >
          <div className="rounded-[10px] bg-ink/80 px-4 py-2 text-paper shadow-lg backdrop-blur-[10px]">
            {profileChildren.map(page => {
              const label =
                page.localizeInfos?.menuTitle || page.localizeInfos?.title || page.pageUrl;
              // Спец-кейс: `bookings` открывается как попап
              // (`BookingsPopup` через OpenDrawerContext) — у нас нет
              // выделенной страницы /profile/bookings, бронирования
              // живут в overlay по дизайну `mob_about_reservation.html`.
              if (page.pageUrl === 'bookings') {
                return (
                  <li key={page.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setHoverOpen(false);
                        setComponent('BookingsPopup');
                        setOpen(true);
                      }}
                      className="block w-full p-2 text-left text-paper hover:text-brand"
                    >
                      {label}
                    </button>
                  </li>
                );
              }
              return (
                <li key={page.id} role="none">
                  <Link
                    role="menuitem"
                    href={`/${PROFILE_PAGE_URL}/${page.pageUrl}`}
                    onClick={() => setHoverOpen(false)}
                    className="block p-2 text-paper hover:text-brand"
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li role="none" onClick={() => setHoverOpen(false)}>
              <LogoutMenuItem />
            </li>
          </div>
        </ul>
      ) : null}
    </div>
  );
};

export default NavItemProfile;
