'use client';

import Link from 'next/link';
import type { IMenusEntity, IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useState } from 'react';

import ProfileIcon from '@/components/icons/profile';

import ProfileMenuAnimations from '../../animations/ProfileMenuAnimations';
import LogoutMenuItem from './LogoutMenuItem';
import UserMenuItem from './UserMenuItem';

/**
 * Компонент меню User Profile.
 */
const UserProfileMenu = ({ userMenu }: { userMenu: IMenusEntity }): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  // Убеждаемся, что pages определены и корректного типа
  const pages = (userMenu.pages || []) as IMenusPages[];

  return (
    <div className="relative flex">
      <Link
        href="/profile"
        onPointerEnter={() => setIsOpen(true)}
        className="group relative my-auto box-border flex size-6 shrink-0"
      >
        <ProfileIcon />
      </Link>
      <ProfileMenuAnimations
        state={isOpen}
        setState={setIsOpen}
        className="absolute right-0 top-8 h-0 w-48 overflow-hidden rounded-[10px] bg-ink/80 px-4 text-paper shadow-lg backdrop-blur-[10px]"
      >
        <ul className="my-4 text-paper">
          {pages.map((page, index) => (
            <li key={index}>
              <UserMenuItem page={page} setState={setIsOpen} />
            </li>
          ))}
          <li>
            <LogoutMenuItem />
          </li>
        </ul>
      </ProfileMenuAnimations>
    </div>
  );
};

export default UserProfileMenu;
