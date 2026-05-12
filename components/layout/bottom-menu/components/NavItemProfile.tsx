'use client';

import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import EyeCircleIcon from '@/components/icons/eye-circle';

/**
 * NavItemProfile — profile nav-item button; toggles `ProfilePopup` when authenticated, otherwise the auth-provider picker.
 *
 * @param   {object}      props      - Component props.
 * @param   {IMenusPages} props.item - OneEntry menu page entity (used for the accessible title only).
 * @returns JSX of the profile button.
 */
const NavItemProfile = ({ item }: { item: IMenusPages }): JSX.Element => {
  const {
    open,
    component,
    transition,
    setOpen,
    setComponent,
    setTransition,
    setPostAuthComponent,
  } = useContext(OpenDrawerContext);
  const { isAuth } = useContext(AuthContext);
  const title = item.localizeInfos?.menuTitle || item.localizeInfos?.title;

  const handleClick = () => {
    const target = isAuth ? 'ProfilePopup' : 'AuthProviderSelect';
    if (open && component === target && transition !== 'close') {
      setTransition('close');
      return;
    }
    // Signal the auth flow to swap to ProfilePopup on success instead of closing the drawer.
    // Cleared by `OpenDrawerProvider` when the drawer ultimately closes (e.g. user cancels auth).
    if (!isAuth) setPostAuthComponent('ProfilePopup');
    setOpen(true);
    setComponent(target);
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
