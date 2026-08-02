'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { prefetchPopup } from '@/components/layout/popupRegistry';

/**
 * SignInPrompt — auth gate for unauthenticated users: a dictionary phrase with an inline
 * "sign in" button that opens the auth drawer (`AuthProviderSelect`).
 *
 * Looks up the sign-in label inside the prompt phrase (case-insensitive) and splits the text
 * around it so the button renders inline; when the label is absent from the phrase, the button
 * is appended after the text.
 *
 * @param   {object} [props]                - Component props.
 * @param   {string} [props.promptKey]      - Dictionary key for the prompt phrase.
 * @param   {string} [props.promptFallback] - Fallback prompt text when the key is missing.
 * @param   {string} [props.className]      - Wrapper class override.
 * @returns JSX of the sign-in prompt with an inline auth-drawer trigger.
 */
const SignInPrompt = ({
  promptKey = 'profile_signin_prompt',
  promptFallback = 'Please sign in to view your profile.',
  className = 'rounded-xl bg-ink/60 p-6 text-center text-paper/90',
}: {
  promptKey?: string;
  promptFallback?: string;
  className?: string;
} = {}): JSX.Element => {
  const t = useT();
  const { setComponent, setOpen } = useContext(OpenDrawerContext);

  const prompt = t(promptKey, promptFallback);
  const signInLabel = t('sign_in_text', 'sign in');
  const idx = prompt.toLowerCase().indexOf(signInLabel.toLowerCase());
  const before = idx >= 0 ? prompt.slice(0, idx) : prompt + ' ';
  const after = idx >= 0 ? prompt.slice(idx + signInLabel.length) : '';

  return (
    <div className={className}>
      {before}
      <button
        type="button"
        onClick={() => {
          setComponent('AuthProviderSelect');
          setOpen(true);
        }}
        onPointerEnter={() => prefetchPopup('AuthProviderSelect')}
        onFocus={() => prefetchPopup('AuthProviderSelect')}
        className="cursor-pointer text-brand underline underline-offset-2 hover:no-underline"
      >
        {signInLabel}
      </button>
      {after}
    </div>
  );
};

export default SignInPrompt;
