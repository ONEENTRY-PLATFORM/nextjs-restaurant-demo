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
 * NavItemProfile - profile icon in the top menu.
 *
 * Unauthenticated â†’ opens SignInForm; authenticated â†’ links to `/profile`,
 * hover reveals the sub-menu of children of the `profile` item from the `user_menu` CMS menu.
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

  // Children of the `profile` item in `user_menu` - sub-menu contents.
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
          // `pt-2` - gap so the hover zone doesn't break when the cursor moves from the icon to the sub-menu.
          className="absolute right-0 top-6 z-30 w-48 pt-2"
        >
          <div className="rounded-panel bg-ink/80 px-4 py-2 text-paper shadow-lg backdrop-blur-card">
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
