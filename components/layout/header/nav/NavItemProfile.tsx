'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ProfileIcon from '@/components/icons/profile';

/**
 * Кнопка nav-элемента профиля — открывает {@link ProfilePopup} для
 * авторизованных пользователей либо модалку входа в остальных случаях.
 * Зеркалит флоу из `static-html` details_personal.html, где иконка
 * пользователя триггерит выезжающий drawer профиля (отдельная страница
 * `/profile` сохранена как fallback для прямых deep-link'ов).
 */
const NavItemProfile = (): JSX.Element => {
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);
  const { isAuth } = useContext(AuthContext);

  const handleClick = () => {
    setComponent(isAuth ? 'ProfilePopup' : 'SignInForm');
    setOpen(!open);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative my-auto box-border flex size-6 shrink-0 cursor-pointer"
      aria-label={isAuth ? 'Profile' : 'Sign In'}
    >
      <ProfileIcon />
    </button>
  );
};

export default NavItemProfile;
