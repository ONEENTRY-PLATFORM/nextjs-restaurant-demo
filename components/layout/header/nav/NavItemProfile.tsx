'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ProfileIcon from '@/components/icons/profile';

/**
 * Nav item profile button — opens {@link ProfilePopup} for authenticated
 * users or the sign-in modal otherwise. Mirrors the `static-html`
 * details_personal.html flow where the user icon triggers a slide-in
 * profile drawer (the standalone `/profile` page is preserved as a
 * fallback for direct deep-links).
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
