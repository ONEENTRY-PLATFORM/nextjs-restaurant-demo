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
 * NavItemProfile — иконка профиля в верхнем меню.
 *
 * Не авторизован → открывает SignInForm; авторизован → ведёт на `/profile`,
 * hover раскрывает sub-меню children пункта `profile` из CMS-меню `user_menu`.
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

  // Children пункта `profile` в `user_menu` — содержимое подменю.
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
          // `pt-2` — gap, чтобы hover-зона не разрывалась при переходе курсора с иконки на подменю.
          className="absolute right-0 top-6 z-30 w-48 pt-2"
        >
          <div className="rounded-[10px] bg-ink/80 px-4 py-2 text-paper shadow-lg backdrop-blur-[10px]">
            {profileChildren.map(page => {
              const label =
                page.localizeInfos?.menuTitle || page.localizeInfos?.title || page.pageUrl;
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
