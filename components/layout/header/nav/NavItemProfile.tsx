'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useContext, useMemo, useState } from 'react';

import { useGetMenuByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { MENUS, PAGES } from '@/app/utils/constants';
import ProfileIcon from '@/components/icons/profile';
import { prefetchPopup } from '@/components/layout/popupRegistry';

import LogoutMenuItem from './user-menu/LogoutMenuItem';

/**
 * NavItemProfile — profile icon in the top menu.
 *
 * Unauthenticated → opens SignInForm; authenticated → links to `/profile`,
 * hover reveals the sub-menu of children of the `profile` item from the `user_menu` CMS menu.
 *
 * @returns JSX of the profile icon button (with hover sub-menu when authenticated).
 */
const NavItemProfile = (): JSX.Element => {
  const t = useT();
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);
  const { isAuth } = useContext(AuthContext);

  const [hoverOpen, setHoverOpen] = useState(false);

  const { data: menu } = useGetMenuByMarkerQuery({ marker: MENUS.userMenu }, { skip: !isAuth });

  // Children of the `profile` item in `user_menu` - sub-menu contents.
  const profileChildren = useMemo<IMenusPages[]>(() => {
    const pages = menu?.pages ?? [];
    const profileEntry = pages.find(p => p.pageUrl === PAGES.profile);
    if (!profileEntry) return [];
    return pages
      .filter(p => p.parentId === profileEntry.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [menu]);

  const handleGuestClick = () => {
    setComponent('AuthProviderSelect');
    setOpen(!open);
  };

  // The wrapping `<div>` is intentionally rendered in both branches so that the
  // root DOM node stays stable across auth changes. `HeaderAnimations` runs
  // once on mount and writes inline `opacity/visibility` onto each direct child
  // of `[data-header-anim="top-nav"]`; the CSS pre-hide in `main.css` keeps
  // those children hidden until GSAP reveals them. If the root element type
  // changed on login (e.g. `<button>` → `<div>`), the fresh DOM node would
  // re-trigger the CSS pre-hide and the icon would vanish.
  return (
    <div
      className="relative flex"
      onPointerEnter={isAuth ? () => setHoverOpen(true) : undefined}
      onPointerLeave={isAuth ? () => setHoverOpen(false) : undefined}
    >
      {isAuth ? (
        <Link
          href="/profile"
          className="group relative my-auto box-border flex size-6 shrink-0"
          aria-label={t('profile_label', 'Profile')}
        >
          <ProfileIcon />
        </Link>
      ) : (
        <button
          onClick={handleGuestClick}
          onPointerEnter={() => prefetchPopup('AuthProviderSelect')}
          onFocus={() => prefetchPopup('AuthProviderSelect')}
          className="group relative my-auto box-border flex size-6 shrink-0 cursor-pointer"
          aria-label={t('sign_in_text', 'Sign In')}
        >
          <ProfileIcon />
        </button>
      )}
      {isAuth && hoverOpen && profileChildren.length > 0 ? (
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
                    href={`/${PAGES.profile}/${page.pageUrl}`}
                    onClick={() => setHoverOpen(false)}
                    className="block p-2 text-paper transition-colors duration-200 hover:text-brand"
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
