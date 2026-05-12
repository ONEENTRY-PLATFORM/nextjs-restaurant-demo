'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ProfileSections from '@/components/profile/ProfileSections';

/**
 * ProfilePageClient — client-side renderer for the profile data section (auth-gated).
 *
 * @returns JSX of the loading state, sign-in prompt, or the authenticated profile sections.
 */
const ProfilePageClient = (): JSX.Element => {
  const t = useT();
  const { isAuth, isLoading } = useContext(AuthContext);
  const { setComponent, setOpen } = useContext(OpenDrawerContext);

  if (isLoading) {
    return <div className="text-paper/80">{t('profile_loading_text', '')}</div>;
  }

  if (!isAuth) {
    // Inline "sign in" button inside the dictionary phrase: search for the substring (case-insensitive); if not found - render the button after the text.
    const prompt = t('profile_signin_prompt', 'Please sign in to view your profile.');
    const signInLabel = t('sign_in_text', 'sign in');
    const idx = prompt.toLowerCase().indexOf(signInLabel.toLowerCase());
    const before = idx >= 0 ? prompt.slice(0, idx) : prompt + ' ';
    const after = idx >= 0 ? prompt.slice(idx + signInLabel.length) : '';
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        {before}
        <button
          type="button"
          onClick={() => {
            setComponent('AuthProviderSelect');
            setOpen(true);
          }}
          className="cursor-pointer text-brand underline underline-offset-2 hover:no-underline"
        >
          {signInLabel}
        </button>
        {after}
      </div>
    );
  }

  return <ProfileSections />;
};

export default ProfilePageClient;
