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
 * UserProfileMenu — desktop profile dropdown with hover-reveal animation; renders `UserMenuItem` rows + `LogoutMenuItem`.
 *
 * @param   {object}        props          - Component props.
 * @param   {IMenusEntity}  props.userMenu - OneEntry menu entity that supplies the dropdown items.
 * @returns {JSX.Element} JSX of the profile button with attached dropdown menu.
 */
const UserProfileMenu = ({ userMenu }: { userMenu: IMenusEntity }): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

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
        className="absolute right-0 top-8 h-0 w-48 overflow-hidden rounded-panel bg-ink/80 px-4 text-paper shadow-lg backdrop-blur-card"
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
