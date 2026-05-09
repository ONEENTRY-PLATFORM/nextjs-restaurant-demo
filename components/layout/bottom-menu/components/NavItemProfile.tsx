'use client';

import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import EyeCircleIcon from '@/components/icons/eye-circle';

/** Ссылка nav-элемента профиля / кнопка SignInForm. */
const NavItemProfile = ({ item }: { item: IMenusPages }): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const { isAuth } = useContext(AuthContext);
  const title = item.localizeInfos?.menuTitle || item.localizeInfos?.title;

  const handleClick = () => {
    setOpen(true);
    setComponent(isAuth ? 'ProfilePopup' : 'AuthProviderSelect');
  };

  return (
    <button
      onClick={handleClick}
      title={title}
      className="group relative box-border flex size-6 shrink-0"
    >
      <EyeCircleIcon />
    </button>
  );
};

export default NavItemProfile;
